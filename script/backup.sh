#\!/bin/bash
docker compose -f /opt/mise/docker-compose.prod.yml exec -T db pg_dump -U postgres mise | gzip > /opt/mise/backups/mise-$(date +%Y%m%d-%H%M).sql.gz
find /opt/mise/backups -name "*.sql.gz" -mtime +30 -delete
echo "Backup done: $(date)" >> /opt/mise/backups/backup.log
