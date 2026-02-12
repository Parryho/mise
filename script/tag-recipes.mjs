import pg from "pg";
const { Pool } = pg;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const CUISINE_KW = {
  austrian: ["schnitzel","knödel","nockerl","spätzle","kaiserschmarrn","tafelspitz","gulasch","beuschel","kraut","grammel","erdäpfel","schweins","hendl","backhendl","stelze","marillen","zwetschgen","topfen","mohn","strudel","serviettenknödel","semmelknödel","leberknödel","kaspressknödel","gröstl","kasnocken","germknödel","palatschinken","blunzen","geselchtes","selch","fritatten","rindssuppe","grießnockerl"],
  italian: ["pasta","spaghetti","penne","lasagne","risotto","polenta","arrabiata","pomodoro","carbonara","bolognese","pesto","tiramisù","mozzarella","parmesan","al forno","saltimbocca","gnocchi","tortellini","ravioli"],
  asian: ["curry","wok","soja","teriyaki","thai","ingwer","kokos","sesam","basmati","jasmin","sushi","ramen","pad thai","tempura","miso","edamame","kimchi","süß-sauer","glasnudeln","asia"],
  mediterranean: ["oliven","feta","tzatziki","moussaka","couscous","bulgur","hummus","falafel","taboulé","souvlaki","gyros"],
};

const FLAVOR_KW = {
  hearty: ["braten","schmalz","speck","schweins","gansl","ente","gulasch","grammel","blunzen","stelze","geselchtes","selch","wurzel","kraut","kümmel","jäger","zwiebel"],
  light: ["gedünstet","dampf","salat","gemüse","fisch","forelle","zander","scholle","tofu","joghurt","quark","obst"],
  spicy: ["chili","paprika scharf","curry scharf","peperoni","jalapeño","cayenne","tabasco","sriracha"],
  creamy: ["rahm","sahne","obers","käse","überbacken","gratin","béchamel","hollandaise","carbonara","alfredo"],
  fresh: ["kräuter","zitrone","limette","minze","basilikum","gurke","radieschen"],
};

const SC_KW = ["spätzle","fleckerl","lasagne","pasta","spaghetti","penne","auflauf","gratin","überbacken","moussaka","strudel","quiche","flammkuchen","spinatknödel","kaspressknödel","kasnocken","grammelknödel","curry","eintopf","chili sin","dal","gröstl","risotto","polenta","tortellini","ravioli","gnocchi","pad thai","ramen"];
const DM_KW = ["marillenknödel","zwetschgenknödel","topfenknödel","mohnnudel","germknödel","kaiserschmarrn","palatschinken","dampfnudel"];

function match(name, map) {
  const l = name.toLowerCase();
  for (const [k, words] of Object.entries(map)) {
    for (const w of words) { if (l.includes(w)) return k; }
  }
  return null;
}

function matchList(name, list) {
  const l = name.toLowerCase();
  for (const w of list) { if (l.includes(w)) return true; }
  return false;
}

const dryRun = process.argv.includes("--dry-run");
const { rows } = await pool.query("SELECT id, name, category, cuisine_type, flavor_profile, dish_type FROM recipes");
const stats = { total: rows.length, tagged: { cuisine: 0, flavor: 0, dishType: 0 }, untagged: { cuisine: 0, flavor: 0, dishType: 0 } };

for (const r of rows) {
  const updates = {};
  if (!r.cuisine_type) {
    let c = match(r.name, CUISINE_KW);
    if (!c && ["ClearSoups","CreamSoups","HotSauces","ColdSauces"].includes(r.category)) c = "austrian";
    if (c) { updates.cuisine_type = c; stats.tagged.cuisine++; } else stats.untagged.cuisine++;
  }
  if (!r.flavor_profile) {
    const f = match(r.name, FLAVOR_KW);
    if (f) { updates.flavor_profile = f; stats.tagged.flavor++; } else stats.untagged.flavor++;
  }
  if (!r.dish_type) {
    let d = null;
    if (matchList(r.name, DM_KW)) d = "dessertMain";
    else if (matchList(r.name, SC_KW)) d = "selfContained";
    else if (["MainMeat","MainFish","MainVegan"].includes(r.category)) d = "needsSides";
    if (d) { updates.dish_type = d; stats.tagged.dishType++; } else stats.untagged.dishType++;
  }
  if (Object.keys(updates).length > 0 && !dryRun) {
    const sets = Object.entries(updates).map(([k,v],i) => `${k} = $${i+1}`).join(", ");
    await pool.query(`UPDATE recipes SET ${sets} WHERE id = $${Object.keys(updates).length+1}`, [...Object.values(updates), r.id]);
  }
}

console.log(JSON.stringify(stats, null, 2));
await pool.end();
