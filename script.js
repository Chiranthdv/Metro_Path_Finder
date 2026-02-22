const stations = [
"Nagasandra","Dasarahalli","Jalahalli","Peenya Industry","Peenya",
"Goraguntepalya","Yeshwanthpur","Sandal Soap Factory","Mahalakshmi",
"Rajajinagar","Mahakavi Kuvempu Road","Srirampura","Mantri Square Sampige Road",
"Majestic",
"Magadi Road","Hosahalli","Vijayanagar","Attiguppe","Deepanjali Nagar","Mysore Road",
"Nayandahalli","Rajarajeshwari Nagar","Jnanabharathi","Pattanagere",
"Kengeri Bus Terminal",

// PURPLE LINE
"Baiyappanahalli","Swami Vivekananda Road","Indiranagar","Halasuru",
"Trinity","Mahatma Gandhi Road","Cubbon Park","Vidhana Soudha",
"Central College","Majestic Purple",
"Chickpete","Krishna Rajendra Market","National College","Lalbagh",
"South End Circle","Jayanagar","Banashankari"
];

// ================= LINE MAP =================
const GREEN_BREAK = 24; // index 0..24 = green

function getLine(idx) {
  return idx <= GREEN_BREAK ? "green" : "purple";
}

// ================= GRAPH =================
const metroGraph = Array.from({ length: stations.length }, () =>
  Array(stations.length).fill(0)
);

function addEdge(a, b) {
  metroGraph[a][b] = 1;
  metroGraph[b][a] = 1;
}

// 🔥 Build GREEN line
for (let i = 0; i < GREEN_BREAK; i++) {
  addEdge(i, i + 1);
}

// 🔥 Build PURPLE line
for (let i = GREEN_BREAK + 1; i < stations.length - 1; i++) {
  addEdge(i, i + 1);
}

// 🔥 Real interchange at Majestic
const GREEN_MAJESTIC = 13;
const PURPLE_MAJESTIC = stations.indexOf("Majestic Purple");
addEdge(GREEN_MAJESTIC, PURPLE_MAJESTIC);

// ================= AUTO SUGGEST =================
function setupAutoSuggest(inputId, boxId) {
  const input = document.getElementById(inputId);
  const box = document.getElementById(boxId);

  input.addEventListener("input", () => {
    const q = input.value.toLowerCase().trim();
    box.innerHTML = "";
    if (!q) return;

    const matches = stations.filter(s =>
      s.toLowerCase().includes(q)
    );

    if (!matches.length) return;

    const list = document.createElement("div");
    list.className = "suggestions-list";

    matches.slice(0, 8).forEach(station => {
      const item = document.createElement("div");
      item.className = "suggestion-item";
      item.textContent = station;

      item.onclick = () => {
        input.value = station;
        box.innerHTML = "";
      };

      list.appendChild(item);
    });

    box.appendChild(list);
  });

  // hide when clicking outside
  document.addEventListener("click", e => {
    if (!input.contains(e.target)) {
      box.innerHTML = "";
    }
  });
}

setupAutoSuggest("source", "sourceSuggestions");
setupAutoSuggest("destination", "destinationSuggestions");

// ================= ADVANCED DIJKSTRA =================
function dijkstraAdvanced(src, mode) {
  const n = stations.length;
  const dist = new Array(n).fill(Infinity);
  const prev = new Array(n).fill(-1);
  const visited = new Array(n).fill(false);

  dist[src] = 0;

  for (let i = 0; i < n; i++) {
    let u = -1;

    for (let j = 0; j < n; j++) {
      if (!visited[j] && (u === -1 || dist[j] < dist[u])) {
        u = j;
      }
    }

    if (u === -1 || dist[u] === Infinity) break;
    visited[u] = true;

    for (let v = 0; v < n; v++) {
      if (!metroGraph[u][v]) continue;

      let weight = 1;

      // ⭐ interchange penalty
      if (mode === "interchange" && getLine(u) !== getLine(v)) {
        weight = 25;
      }

      if (dist[u] + weight < dist[v]) {
        dist[v] = dist[u] + weight;
        prev[v] = u;
      }
    }
  }

  return { dist, prev };
}

// ================= PATH BUILDER =================
function buildPath(prev, dest) {
  const path = [];
  let cur = dest;

  while (cur !== -1) {
    path.push(stations[cur]);
    cur = prev[cur];
  }

  return path.reverse();
}

// ================= COUNT INTERCHANGES =================
function countInterchanges(path) {
  let count = 0;
  for (let i = 1; i < path.length; i++) {
    const a = stations.indexOf(path[i - 1]);
    const b = stations.indexOf(path[i]);
    if (getLine(a) !== getLine(b)) count++;
  }
  return count;
}

// ================= PREMIUM RENDER ROUTE =================
function renderRoute(path) {
  const container = document.getElementById("routeVisual");
  container.innerHTML = '<div class="route-line" id="routeLine"></div>';
  const line = document.getElementById("routeLine");

  let i = 0;

  function step() {
    if (i >= path.length) return;

    const idx = stations.indexOf(path[i]);
    const isGreen = getLine(idx) === "green";
    const dotColor = isGreen ? "#2ecc71" : "#9b59b6";

    const node = document.createElement("div");
    node.className = "station-node";
    node.innerHTML = `
      <div class="station-dot" style="background:${dotColor}"></div>
      <div>${path[i]}</div>
    `;

    line.appendChild(node);

    if (i !== path.length - 1) {
      const conn = document.createElement("div");
      conn.className = "route-connector";
      line.appendChild(conn);
    }

    i++;
    setTimeout(step, 130);
  }

  step();
}

// ================= BUTTON =================
document.getElementById("findPathButton").onclick = () => {
  const s = document.getElementById("source").value.trim().toLowerCase();
  const d = document.getElementById("destination").value.trim().toLowerCase();
  const mode = document.querySelector('input[name="mode"]:checked').value;

  const si = stations.findIndex(x => x.toLowerCase() === s);
  const di = stations.findIndex(x => x.toLowerCase() === d);

  if (si === -1 || di === -1) {
    alert("Enter valid stations");
    return;
  }

  const { dist, prev } = dijkstraAdvanced(si, mode);
  const path = buildPath(prev, di);
  const interchanges = countInterchanges(path);

  document.getElementById("summaryCard").style.display = "grid";
  document.getElementById("summaryCard").innerHTML = `
    <div>🚇 Stations: ${path.length - 1}</div>
    <div>🔁 Interchanges: ${interchanges}</div>
    <div>🧭 Mode: ${mode === "shortest" ? "Shortest Path" : "Minimum Interchanges"}</div>
    <div>⏱ Time: ${(path.length - 1) * 2} mins</div>
  `;

  renderRoute(path);
};
