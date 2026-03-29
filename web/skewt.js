(function () {
    const svg = d3.select("#skewt");
    const margin = { top: 20, right: 20, bottom: 55, left: 60 };

    function draw() {
        svg.selectAll("*").remove();

        const W = svg.node().clientWidth  - margin.left - margin.right;
        const H = svg.node().clientHeight - margin.top  - margin.bottom;
        if (W <= 0 || H <= 0) return;

        const x = d3.scaleLinear().domain([-40, 40]).range([0, W]);
        const y = d3.scaleLog().domain([1013, 100]).range([H, 0]);

        const g = svg.append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        g.append("rect")
            .attr("width", W).attr("height", H)
            .attr("fill", "white").attr("stroke", "#ccc");

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
