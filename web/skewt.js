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
    let bg_data = null;
    let sounding_data = null;

    let model_data = null;
    let current_time = 0;

    fetch("/api/background").then(r => r.json()).then(bg => {
        bg_data = bg;
        draw();
    });

    document.getElementById("fetch_model_btn").addEventListener("click", () => {
        const lat   = document.getElementById("lat_input").value;
        const lon   = document.getElementById("lon_input").value;
        const date  = document.getElementById("date_input").value;
        const model = document.getElementById("model_select").value;

        if (!lat || !lon || !date) return;

        const spinner = document.getElementById("plot_spinner");
        spinner.style.display = "";

        const url = `/api/model_sounding?lat=${lat}&lon=${lon}&model=${model}&date=${date}`;
        fetch(url).then(r => r.json()).then(data => {
            spinner.style.display = "none";
            model_data = data;
            current_time = 12;

            const slider = document.getElementById("time_slider");
            slider.max = data.times.length - 1;
            slider.value = current_time;
            document.getElementById("time_label").textContent = data.times[current_time] + " UTC";
            document.getElementById("time_section").style.display = "";

            sounding_data = {
                p_hpa: data.p_hpa,
                T:     data.T[current_time],
                Td:    data.Td[current_time],
            };
            draw();
        });
    });

    document.getElementById("time_slider").addEventListener("input", (e) => {
        if (!model_data) return;
        current_time = +e.target.value;
        document.getElementById("time_label").textContent = model_data.times[current_time] + " UTC";
        sounding_data = {
            p_hpa: model_data.p_hpa,
            T:     model_data.T[current_time],
            Td:    model_data.Td[current_time],
        };
        draw();
    });

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

        const chart = g.append("g").attr("clip-path", "url(#skewt-clip)");

        if (bg_data) {
            drawLines(chart, x, y, bg_data.isotherms,      bg_data.p_isotherms, "rgba(179,179,179,0.7)");
            drawLines(chart, x, y, bg_data.isohumes,       bg_data.p_isohumes,  "rgba(31,119,180,0.7)");
            drawLines(chart, x, y, bg_data.dry_adiabats,   bg_data.p_dry,       "rgba(214,39,40,0.7)");
            drawLines(chart, x, y, bg_data.moist_adiabats, bg_data.p_moist,     "rgba(179,179,179,0.7)");
        }

        if (sounding_data) {
            const line = d3.line()
                .x(d => x(d[0]))
                .y(d => y(d[1]));

            const t_pts  = sounding_data.T.map( (t, i) => [t, sounding_data.p_hpa[i]]);
            const td_pts = sounding_data.Td.map((t, i) => [t, sounding_data.p_hpa[i]]);

            function draw_profile(pts, color) {
                const path = chart.append("path").datum(pts)
                    .attr("fill", "none")
                    .attr("stroke", color)
                    .attr("stroke-width", 2.5)
                    .attr("d", line);

                const drag = d3.drag()
                    .on("start", function () {
                        d3.select(this).style("cursor", "grabbing");
                    })
                    .on("drag", function (event, d) {
                        d[0] = x.invert(event.x);
                        d3.select(this).attr("cx", x(d[0]));
                        path.attr("d", line);
                    })
                    .on("end", function () {
                        d3.select(this).style("cursor", "grab");
                    });

                chart.selectAll(null).data(pts).enter()
                    .append("circle")
                    .attr("cx", d => x(d[0]))
                    .attr("cy", d => y(d[1]))
                    .attr("r", 5)
                    .attr("fill", "white")
                    .attr("stroke", color)
                    .attr("stroke-width", 2)
                    .style("cursor", "grab")
                    .call(drag);
            }

            draw_profile(t_pts,  "#e0333c");
            draw_profile(td_pts, "#2a7ec8");
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
