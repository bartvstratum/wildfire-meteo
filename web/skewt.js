//
// Copyright 2026 Wageningen University & Research (WUR)
// Author: Bart van Stratum
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//

(function () {
    const svg = d3.select("#skewt");
    const margin = { top: 30, right: 30, bottom: 65, left: 70 };
    let bgData = null;

    fetch("/api/background")
        .then(r => r.json())
        .then(data => { bgData = data; draw(); });

    function drawLines(chart, x, y, temps, pressures_pa, color) {
        const p_hpa = pressures_pa.map(p => p / 100);
        const lineGen = d3.line()
            .x((T, i) => x(T))
            .y((T, i) => y(p_hpa[i]));
        temps.forEach(line => {
            chart.append("path")
                .datum(line)
                .attr("fill", "none")
                .attr("stroke", color)
                .attr("stroke-width", 1)
                .attr("stroke-dasharray", "4,2")
                .attr("d", lineGen);
        });
    }

    function draw() {
        svg.selectAll("*").remove();

        const W = svg.node().clientWidth  - margin.left - margin.right;
        const H = svg.node().clientHeight - margin.top  - margin.bottom;
        if (W <= 0 || H <= 0) return;

        const x = d3.scaleLinear().domain([-40, 50]).range([0, W]);
        const y = d3.scaleLog().domain([1013, 100]).range([H, 0]);

        const g = svg.append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        g.append("rect")
            .attr("width", W).attr("height", H)
            .attr("fill", "white").attr("stroke", "#ccc");

        // Clip path so background lines don't overflow the plot area.
        g.append("clipPath").attr("id", "skewt-clip")
            .append("rect").attr("width", W).attr("height", H);

        if (bgData) {
            const chart = g.append("g").attr("clip-path", "url(#skewt-clip)");
            drawLines(chart, x, y, bgData.isotherms,      bgData.p_isotherms, "rgba(179,179,179,0.7)");
            drawLines(chart, x, y, bgData.isohumes,       bgData.p_isohumes,  "rgba(31,119,180,0.7)");
            drawLines(chart, x, y, bgData.dry_adiabats,   bgData.p_dry,       "rgba(214,39,40,0.7)");
            drawLines(chart, x, y, bgData.moist_adiabats, bgData.p_moist,     "rgba(179,179,179,0.7)");
        }

        g.append("g").call(d3.axisLeft(y)
            .tickValues([1000, 850, 700, 500, 400, 300, 200, 100])
            .tickFormat(d => d))
            .selectAll("text").style("font-size", "14px");

        g.append("g")
            .attr("transform", `translate(0,${H})`)
            .call(d3.axisBottom(x).ticks(8).tickFormat(d => d + "°"))
            .selectAll("text").style("font-size", "14px");

        g.append("text")
            .attr("transform", "rotate(-90)")
            .attr("x", -H / 2).attr("y", -42)
            .attr("text-anchor", "middle")
            .style("font-size", "14px")
            .text("Pressure (hPa)");

        g.append("text")
            .attr("x", W / 2).attr("y", H + 38)
            .attr("text-anchor", "middle")
            .style("font-size", "14px")
            .text("Temperature (°C)");
    }

    draw();
    window.addEventListener("resize", draw);
})();
