import type { Express, Request, Response } from "express";
import { requireAuth, getParam, storage } from "./middleware";
import {
  insertStaffSchema, updateStaffSchema,
  insertShiftTypeSchema, updateShiftTypeSchema,
  insertScheduleEntrySchema, updateScheduleEntrySchema
} from "@shared/schema";

export function registerScheduleRoutes(app: Express) {
  // === STAFF ===
  app.get("/api/staff", requireAuth, async (req, res) => {
    const { locationId } = req.query;
    const locId = locationId ? parseInt(locationId as string, 10) : undefined;
    const members = await storage.getStaff();
    const filtered = locId ? members.filter(s => s.locationId === locId) : members;
    res.json(filtered);
  });

  app.get("/api/staff/:id", requireAuth, async (req, res) => {
    const id = parseInt(getParam(req.params.id), 10);
    const member = await storage.getStaffMember(id);
    if (!member) return res.status(404).json({ error: "Mitarbeiter nicht gefunden" });
    res.json(member);
  });

  app.post("/api/staff", requireAuth, async (req, res) => {
    try {
      const parsed = insertStaffSchema.parse(req.body);
      const created = await storage.createStaff(parsed);
      res.status(201).json(created);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.put("/api/staff/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(getParam(req.params.id), 10);
      const parsed = updateStaffSchema.parse(req.body);
      const updated = await storage.updateStaff(id, parsed);
      if (!updated) return res.status(404).json({ error: "Mitarbeiter nicht gefunden" });
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/staff/:id", requireAuth, async (req, res) => {
    const id = parseInt(getParam(req.params.id), 10);
    await storage.deleteStaff(id);
    res.status(204).send();
  });

  // === SHIFT TYPES (Dienste) ===
  app.get("/api/shift-types", requireAuth, async (req, res) => {
    const shiftTypes = await storage.getShiftTypes();
    res.json(shiftTypes);
  });

  app.post("/api/shift-types", requireAuth, async (req, res) => {
    try {
      const parsed = insertShiftTypeSchema.parse(req.body);
      const created = await storage.createShiftType(parsed);
      res.status(201).json(created);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.put("/api/shift-types/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(getParam(req.params.id), 10);
      const parsed = updateShiftTypeSchema.parse(req.body);
      const updated = await storage.updateShiftType(id, parsed);
      if (!updated) return res.status(404).json({ error: "Diensttyp nicht gefunden" });
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/shift-types/:id", requireAuth, async (req, res) => {
    const id = parseInt(getParam(req.params.id), 10);
    await storage.deleteShiftType(id);
    res.status(204).send();
  });

  // === SCHEDULE ===
  // R2-T9: Added mine=1 filter for "Meine Schichten"
  app.get("/api/schedule", requireAuth, async (req, res) => {
    const { start, end, mine } = req.query;
    const startDate = (start as string) || new Date().toISOString().split('T')[0];
    const endDate = (end as string) || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    let entries = await storage.getScheduleEntries(startDate, endDate);

    // Filter to only show user's own shifts
    if (mine === "1") {
      const user = (req as any).user;
      if (user) {
        // Find staff member linked to this user
        const allStaff = await storage.getStaff();
        const myStaff = allStaff.find((s: any) => s.userId === user.id);
        if (myStaff) {
          entries = entries.filter(e => e.staffId === myStaff.id);
        } else {
          // No staff linked to user, return empty
          entries = [];
        }
      }
    }

    res.json(entries);
  });

  app.post("/api/schedule", requireAuth, async (req, res) => {
    try {
      const parsed = insertScheduleEntrySchema.parse(req.body);
      const created = await storage.createScheduleEntry(parsed);
      res.status(201).json(created);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.put("/api/schedule/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(getParam(req.params.id), 10);
      const parsed = updateScheduleEntrySchema.parse(req.body);
      const updated = await storage.updateScheduleEntry(id, parsed);
      if (!updated) return res.status(404).json({ error: "Schichteintrag nicht gefunden" });
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/schedule/:id", requireAuth, async (req, res) => {
    const id = parseInt(getParam(req.params.id), 10);
    await storage.deleteScheduleEntry(id);
    res.status(204).send();
  });

  // === SCHEDULE EXPORT ===
  app.get("/api/schedule/export", requireAuth, async (req, res) => {
    try {
      const { start, end, format = 'pdf' } = req.query;
      const startDate = (start as string) || new Date().toISOString().split('T')[0];
      const endDate = (end as string) || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const entries = await storage.getScheduleEntries(startDate, endDate);
      const staffList = await storage.getStaff();

      const typeNames: Record<string, string> = { shift: 'Schicht', vacation: 'Urlaub', sick: 'Krank', off: 'Frei' };
      const shiftNames: Record<string, string> = { early: 'Früh', late: 'Spät', night: 'Nacht' };

      if (format === 'xlsx') {
        const ExcelJS = await import('exceljs');
        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('Dienstplan');

        sheet.columns = [
          { header: 'Datum', key: 'date', width: 15 },
          { header: 'Mitarbeiter', key: 'staff', width: 20 },
          { header: 'Typ', key: 'type', width: 12 },
          { header: 'Schicht', key: 'shift', width: 12 },
          { header: 'Notizen', key: 'notes', width: 30 }
        ];

        for (const entry of entries) {
          const staffMember = staffList.find(s => s.id === entry.staffId);
          sheet.addRow({
            date: new Date(entry.date).toLocaleDateString('de-DE'),
            staff: staffMember?.name || 'Unbekannt',
            type: typeNames[entry.type] || entry.type,
            shift: entry.shift ? shiftNames[entry.shift] || entry.shift : '-',
            notes: entry.notes || ''
          });
        }

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="Dienstplan_${startDate}_${endDate}.xlsx"`);
        await workbook.xlsx.write(res);
        return;
      }

      // Default: PDF - Landscape table format like traditional Dienstplan
      const PDFDocument = (await import('pdfkit')).default;
      const doc = new PDFDocument({ margin: 30, size: 'A4', layout: 'landscape' });

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="Dienstplan_${startDate}_${endDate}.pdf"`);

      doc.pipe(res);

      const shiftTypes = await storage.getShiftTypes();

      const orange = '#F37021';
      const yellow = '#FFD700';
      const darkGray = '#333333';
      const lightGray = '#E5E5E5';
      const pageWidth = 780;
      const startX = 30;
      const weekdays = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];

      // Generate all dates in range
      const allDates: Date[] = [];
      const current = new Date(startDate);
      const endD = new Date(endDate);
      while (current <= endD) {
        allDates.push(new Date(current));
        current.setDate(current.getDate() + 1);
      }

      // Header
      doc.rect(0, 0, 842, 50).fill(orange);
      doc.fillColor('white').fontSize(20).font('Helvetica-Bold').text('DIENSTPLAN', startX, 15, { align: 'center' });

      const startDStr = new Date(startDate);
      const endDStr = new Date(endDate);
      const dateRange = `${startDStr.toLocaleDateString('de-DE', { day: '2-digit', month: 'long' })} - ${endDStr.toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' })}`;
      doc.fontSize(10).text(dateRange, startX, 38, { align: 'center' });

      // Table setup
      const nameColWidth = 100;
      const dayColWidth = Math.min(90, (pageWidth - nameColWidth) / allDates.length);
      const rowHeight = 22;
      let yPos = 65;

      // Table header row - Days
      doc.fillColor(darkGray);
      doc.rect(startX, yPos, nameColWidth, rowHeight).fill('#F0F0F0').stroke();
      doc.fillColor(darkGray).fontSize(9).font('Helvetica-Bold').text('Mitarbeiter', startX + 5, yPos + 6);

      for (let i = 0; i < allDates.length; i++) {
        const d = allDates[i];
        const x = startX + nameColWidth + (i * dayColWidth);
        const isWeekend = d.getDay() === 0 || d.getDay() === 6;

        doc.rect(x, yPos, dayColWidth, rowHeight).fill(isWeekend ? yellow : '#F0F0F0').stroke();
        doc.fillColor(darkGray).fontSize(8).font('Helvetica-Bold');
        doc.text(`${weekdays[d.getDay()]}`, x + 2, yPos + 4, { width: dayColWidth - 4, align: 'center' });
        doc.fontSize(7).font('Helvetica').text(`${d.getDate()}.${d.getMonth() + 1}`, x + 2, yPos + 13, { width: dayColWidth - 4, align: 'center' });
      }
      yPos += rowHeight;

      // Staff rows
      for (const staff of staffList) {
        // Name cell
        doc.rect(startX, yPos, nameColWidth, rowHeight).fill('#FAFAFA').stroke();
        doc.fillColor(darkGray).fontSize(8).font('Helvetica-Bold').text(staff.name.split(' ')[0], startX + 5, yPos + 7);

        // Day cells
        for (let i = 0; i < allDates.length; i++) {
          const d = allDates[i];
          const dateStr = d.toISOString().split('T')[0];
          const x = startX + nameColWidth + (i * dayColWidth);
          const isWeekend = d.getDay() === 0 || d.getDay() === 6;

          const entry = entries.find(e => e.staffId === staff.id && e.date === dateStr);

          let cellBg = isWeekend ? '#FFFACD' : 'white';
          let cellText = '';

          if (entry) {
            if (entry.type === 'vacation') {
              cellBg = '#90EE90';
              cellText = 'U';
            } else if (entry.type === 'sick') {
              cellBg = '#FFB6C1';
              cellText = 'K';
            } else if (entry.type === 'off') {
              cellText = 'X';
            } else if (entry.type === 'wor') {
              cellText = 'WOR';
            } else if (entry.type === 'shift' && entry.shiftTypeId) {
              const st = shiftTypes.find(s => s.id === entry.shiftTypeId);
              if (st) {
                cellText = `${st.startTime.substring(0, 5)}`;
              }
            }
          }

          doc.rect(x, yPos, dayColWidth, rowHeight).fill(cellBg).stroke();
          if (cellText) {
            doc.fillColor(darkGray).fontSize(7).font('Helvetica').text(cellText, x + 2, yPos + 7, { width: dayColWidth - 4, align: 'center' });
          }
        }
        yPos += rowHeight;

        // Page break check
        if (yPos > 520) {
          doc.addPage();
          yPos = 40;
        }
      }

      // Legend
      yPos += 15;
      doc.fontSize(8).font('Helvetica-Bold').fillColor(darkGray).text('Legende:', startX, yPos);
      yPos += 12;
      doc.fontSize(7).font('Helvetica');
      const legendItems = [
        { text: 'U = Urlaub', color: '#90EE90' },
        { text: 'K = Krank', color: '#FFB6C1' },
        { text: 'X = Frei', color: 'white' },
        { text: 'WOR = Freier Tag', color: 'white' },
      ];
      let legendX = startX;
      for (const item of legendItems) {
        doc.rect(legendX, yPos, 10, 10).fill(item.color).stroke();
        doc.fillColor(darkGray).text(item.text, legendX + 14, yPos + 1);
        legendX += 70;
      }

      // Shift types legend
      yPos += 15;
      doc.text('Dienste: ', startX, yPos, { continued: true });
      for (const st of shiftTypes) {
        doc.text(`${st.name} (${st.startTime.substring(0,5)}-${st.endTime.substring(0,5)})  `, { continued: true });
      }

      // Footer
      doc.fontSize(7).fillColor('#999').text('Mise - before Serve | Dienstplan', startX, 550, { align: 'center' });

      doc.end();
    } catch (error: any) {
      console.error('Schedule export error:', error);
      res.status(500).json({ error: error.message });
    }
  });
}
