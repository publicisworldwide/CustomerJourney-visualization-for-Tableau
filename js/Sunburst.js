var defaultOptions = {
    // DOM Selectors
    selectors: {
        breadcrumbs: '#sunburst-breadcrumbs',
        chart: '#sunburst-chart',
        description: '#sunburst-description',
        legend: '#sunburst-legend'
    },

    // Dimensions of sunburst.
    width: 1100,
    height: 550,

    // Mapping of step names to colors.
    colors: {
        "offsite_organic": "#08a0e3",
        "onsite": "#0069B7",
        "conversion": "#F6A800",
        "offsite_paid": "#0012bb",
        //"end" : "#bb1331",
        "Email": "#bb1880",
        "Sea": "#00bb53",
        "root": "#ffffff"

    },
    colorsObjNum: {
        "offsite_organic": {
            "direct": 0,
            "otherwebsites": 1,
            "unknown": 2,
            "search": 3,

        },
        "onsite": {
            "configurator": 4,
            "onsite": 5,
            "test_drive": 6
        },
        "conversion": {"test_drive_submit": 8},
        "micro-conv.": {"configurator": 9},
        "offsite_paid": {
            "display": 12,
            "mb.com": 13,
            "email": 14,
            "offsite_paxid": 15,
            "configurator": 16
        },
        "offsite": {
            "organic": 17,
            "paid": 18
        },
        "root": 0
    },

    colorsObj: {
        "offsite_organic": {
            "direct": "#08a0e3",
            "otherwebsites": "#1872a3",
            "unknown": "#667faa",
            "search": "#2147aa",

        },
        "onsite": {
            "configurator": "#06d1db",
            "onsite": "#30b79e",
            "test_drive": "#99bfdb"
        },
        "conversion": {"test_drive_submit": "#86e261"},
        "micro-conv.": {"configurator": "#ccf699"},
        "offsite_paid": {
            "display": "#4900bb",
            "mb.com": "#4900bb",
            "email": "#5a08bb",
            "offsite_paid": "#885bbb",
            "configurator": "#6a0dbb"
        },
        "offsite": {
            "organic": "#0012bb",
            "paid": "#bb1880"
        },
        "root": "#ffffff"
    },
    // Breadcrumb dimensions: width, height, spacing, width of tip/tail.
    breadcrumbs: {
        w: 95, h: 50, s: 3, t: 10
    },
    separator: '>',
    legendField: {
        w: 220, h: 25, s: 5, r: 3
    }
};


class Sunburst {
    constructor(options, data) {

        this.opt = Object.assign({}, defaultOptions, options);
        this.opt.color = d3.scaleOrdinal(d3.schemeCategory20);

        // Total size of all segments; we set this later, after loading the data.
        //this.totalSize = 0;
        if (data) {
            this.setData(data);

        }
    }

    toggleLegend() {
        //this.drawLegend()
        var legend = d3.select(this.opt.selectors.legend);
        if (legend.style("visibility") == "hidden") {
            legend.style("visibility", "");
        }
        else {
            legend.style("visibility", "hidden");
        }
    }

    setData(data) {
        this.datas = data;
        var json = this.buildHierarchy(data);
        this.createVisualization(json);
    }

    updateSun(data) {
        var that = this;
        var json = this.buildHierarchy(data);
        var formatNumber = d3.format(",d");
        var x = d3.scaleLinear()
            .range([0, 2 * Math.PI]);
        var y = d3.scaleSqrt()
            .range([0, this.radius]);

        var arc = d3.arc()
            .startAngle(function (d) {
                return Math.max(0, Math.min(2 * Math.PI, x(d.x0)));
            })
            .endAngle(function (d) {
                return Math.max(0, Math.min(2 * Math.PI, x(d.x1)));
            })
            .innerRadius(function (d) {
                return Math.max(0, y(d.y0));
            })
            .outerRadius(function (d) {
                return Math.max(0, y(d.y1));
            });


        var root = d3.hierarchy(json)
            .sum(function (d) {
                return d.size;
            })
            .sort(function (a, b) {
                return b.height - a.height;
            });


        var partition = d3.partition()
        var nodes = partition(root).descendants().filter(function (d) {
            return (d.x1 - d.x0 > 0.002); // 0.005 radians = 0.29 degrees
        });
        this.svg.selectAll("g").on("click", null);
        this.svg.selectAll("g").on("mouseover", null);
        //this.svg.selectAll("path")
        var update = this.svg.selectAll("path").data(nodes)
            .style("fill", function (d) {
                if (d.data.name == "root") {
                    return "#fff";
                }
                else {

                    var color = that.getColor(d.data.name.split("/")[0], d.data.name.split("/")[1]);
                    // console.log("sun",d.data.name,color)

                    //return that.opt.color(d.data.name.split("/")[0]);
                    return color;
                }
            }).attr("d", arc);


        var exit = update.exit().remove();
        var enter = update.enter()
            .append("path")
            .attr("d", arc);

        enter
            .style("fill", function (d) {
                if (d.data.name == "root") {
                    return "#fff";
                }
                else {

                    var color = that.getColor(d.data.name.split("/")[0], d.data.name.split("/")[1]);
                    console.log("sun", d.data.name, color);

                    //return that.opt.color(d.data.name.split("/")[0]);
                    return color;
                }
            })
            .on("click", this.click)
            .on("mouseover", this.mouseover.bind(this));


        var d = update.data()[0]
        var upData = update.merge(enter)
        console.log(upData.data()[0]);
        this.click(upData.data()[0]);


        function click(d) {
            this.svg.transition()
                .duration(950)
                .tween("scale", function () {
                    var xd = d3.interpolate(x.domain(), [d.x0, d.x1]), yd = d3.interpolate(y.domain(), [d.y0, 1]),
                        yr = d3.interpolate(y.range(), [d.y0 ? 20 : 0, radius]);
                    return function (t) {
                        x.domain(xd(t));
                        y.domain(yd(t)).range(yr(t));
                    };
                })
                .selectAll("path")
                .attrTween("d", function (d) {
                    return function () {
                        return arc(d);
                    };
                });
        }


        this.totalSize = nodes[0].value;
        var namesArr = this.getNodeNames(nodes[0]);
        this.updateLegend(namesArr.sort());

    }

    // Main function to draw and set up the visualization, once we have the data.
    createVisualization(json) {
        var that = this;
        var path;
        var radius = Math.min(this.opt.width, this.opt.height) / 2.1;
        this.radius = radius;
        var formatNumber = d3.format(",d");
        var x = d3.scaleLinear()
            .range([0, 2 * Math.PI]);
        var y = d3.scaleSqrt()
            .range([0, radius]);
        d3.select(this.opt.selectors.chart);
        var arc = d3.arc()
            .startAngle(function (d) {
                return Math.max(0, Math.min(2 * Math.PI, x(d.x0)));
            })
            .endAngle(function (d) {
                return Math.max(0, Math.min(2 * Math.PI, x(d.x1)));
            })
            .innerRadius(function (d) {
                return Math.max(0, y(d.y0));
            })
            .outerRadius(function (d) {
                return Math.max(0, y(d.y1));
            });
        var svg = d3.select(this.opt.selectors.chart).append("svg")
            .attr("width", this.opt.width)
            .attr("height", this.opt.height)
            .append("g")
            .attr("transform", "translate(" + this.opt.width / 1.8 + "," + (this.opt.height / 1.8) + ")");
        svg.append("svg:circle")
            .attr("r", radius)
            .style("opacity", 0);

        this.svg = svg;

        function click(d) {
            svg.transition()
                .duration(950)
                .tween("scale", function () {
                    var xd = d3.interpolate(x.domain(), [d.x0, d.x1]), yd = d3.interpolate(y.domain(), [d.y0, 1]),
                        yr = d3.interpolate(y.range(), [d.y0 ? 20 : 0, radius]);
                    return function (t) {
                        x.domain(xd(t));
                        y.domain(yd(t)).range(yr(t));
                    };
                })
                .selectAll("path")
                .attrTween("d", function (d) {
                    return function () {
                        return arc(d);
                    };
                });
        }


        var root = d3.hierarchy(json)
            .sum(function (d) {
                return d.size;
            })
            .sort(function (a, b) {
                return b.height - a.height;
            });
        var partition = d3.partition()

        var nodes = partition(root).descendants().filter(function (d) {
            return (d.x1 - d.x0 > 0.002); // 0.005 radians = 0.29 degrees
        });

        path = this.svg.selectAll("path")
            .data(nodes)
        var exit = path.exit().remove();
        path
            .enter().append("path").attr("d", arc)
            .style("fill", function (d) {
                if (d.data.name == "root") {
                    return "#fff";
                }
                else {
                    var color = that.getColor(d.data.name.split("/")[0], d.data.name.split("/")[1]);
                    //return that.opt.color(d.data.name.split("/")[0]);
                    console.log(d.data.name, color)
                    return color;
                }
            })
            .on("click", click)
            .on("mouseover", this.mouseover.bind(this));
        this.initializeBreadcrumbTrail();

        let namesArr = this.getNodeNames(nodes[0]);
        try {
            this.drawLegend(namesArr.sort());
            //this.updateScale(namesArr[0].split("/").length)
        }
        catch (e) {
            console.log(e);
        }
        svg.select("circle").on("mouseleave", this.mouseleave.bind(this));
        d3.select("#togglelegend").on("click", that.toggleLegend.bind(this));
        d3.select("#reset").on("click", this.reset.bind(this));
        this.totalSize = root.value;
        this.root = root;
        // d3.select("#treshold").on("input", this.filterData(root));

    }

    reset() {
        var that = this;


        var d = document.chart.svg.selectAll("path").data()[0];
        var x = d3.scaleLinear()
            .range([0, 2 * Math.PI]);
        var y = d3.scaleSqrt()
            .range([0, this.radius]);
        var arc = d3.arc()
            .startAngle(function (d) {
                return Math.max(0, Math.min(2 * Math.PI, x(d.x0)));
            })
            .endAngle(function (d) {
                return Math.max(0, Math.min(2 * Math.PI, x(d.x1)));
            })
            .innerRadius(function (d) {
                return Math.max(0, y(d.y0));
            })
            .outerRadius(function (d) {
                return Math.max(0, y(d.y1));
            });
        // var radius = Math.min(this.opt.width, this.opt.height) / 2;
        this.svg
            .transition()
            .duration(550)
            .tween("scale", function () {
                var xd = d3.interpolate(x.domain(), [d.x0, d.x1]), yd = d3.interpolate(y.domain(), [d.y0, 1]),
                    yr = d3.interpolate(y.range(), [d.y0 ? 20 : 0, that.radius]);
                return function (t) {
                    x.domain(xd(t));
                    y.domain(yd(t)).range(yr(t));
                };
            })
            .selectAll("path")
            .attrTween("d", function (d) {
                return function () {
                    return arc(d);
                };
            });
        d3.selectAll("path").on("mouseover", this.mouseover.bind(this));
    }

    click(d) {
        // var radius = Math.min(this.opt.width, this.opt.height) / 2;
        var that = this;
        var x = d3.scaleLinear()
            .range([0, 2 * Math.PI]);
        var y = d3.scaleSqrt()
            .range([0, that.radius]);
        var arc = d3.arc()
            .startAngle(function (d) {
                return Math.max(0, Math.min(2 * Math.PI, x(d.x0)));
            })
            .endAngle(function (d) {
                return Math.max(0, Math.min(2 * Math.PI, x(d.x1)));
            })
            .innerRadius(function (d) {
                return Math.max(0, y(d.y0));
            })
            .outerRadius(function (d) {
                return Math.max(0, y(d.y1));
            });
        //let svg = d3.select(this.opt.selectors.chart);
        this.svg.transition()
            .duration(950)
            .tween("scale", function () {
                var xd = d3.interpolate(x.domain(), [d.x0, d.x1]), yd = d3.interpolate(y.domain(), [d.y0, 1]),
                    yr = d3.interpolate(y.range(), [d.y0 ? 20 : 0, that.radius]);
                return function (t) {
                    x.domain(xd(t));
                    y.domain(yd(t)).range(yr(t));
                };
            })
            .selectAll("path")
            .attrTween("d", function (d) {
                return function () {
                    return arc(d);
                };
            });
    }

    getNodeNames(node) {
        var names = new Set(names);
        getNodeNamesRecursive(node);

        var namesArray = Array.from(names);
        namesArray.shift()
        function getNodeNamesRecursive(node) {
            var that = this
            try {
                if (node.children) {
                    names.add(node.data.name);
                    node.children.forEach(function (c) {
                        getNodeNamesRecursive(c);
                    });
                }
                names.add(node.data.name);
            }
            catch (e) {
                console.log(e);
            }
        }

        return namesArray;


    }

;

    updateData(data) {
        /*        var that = this;
         console.log(this.svg);
         this.svg.select("circle").remove();
         this.svg.selectAll("path").remove();
         this.svg.remove();
         d3.selectAll("#legend svg").remove();
         d3.selectAll("#chart > svg").remove();
         this.setData(data);
         console.log("Data updated ");*/
        this.updateSun(data);
    }

    filterData(root) {
        var that = this;
        console.log("Filtering Data");
        var d = d3.selectAll("path").data()[0];
        var treshold = document.getElementById("treshold").value;
        var partition = d3.partition();
        //d3.select("#tresholdValue").text(this.value);
        var tmp = root;
        var filtered = _.filter(partition(tmp).descendants(), function (elem) {
            return elem.value > treshold;
        });
        // console.log(filtered);
        var path = this.svg.selectAll("path").data(filtered);
        path.exit()
            .transition().duration(450).style("fill", "#fff")
            .remove();
        path.enter().append("path")
            .attr("d", arc)
            .style("fill", function (d) {
                if (d.data.name == "root") {
                    return "#fff";
                }
                else {
                    var color = this.opt.color(that.resolveStepName(d.data.name));
                    return color;
                }
            })
            .on("click", this.click.bind(this))
            .on("mouseover", this.mouseover.bind(this));
        this.totalSize = filtered[0].value;
    }

    // Fade all but the current sequence, and show it in the breadcrumb trail.
    mouseover(d) {
        var conType = _.has(d.data, "conversion_type") ? d.data.conversion_type : "";

        var percentage = (100 * d.value / this.totalSize).toPrecision(3);
        var percentageString = percentage + "%" + ' - ' + d.value;
        if (percentage < 0.5) {
            percentageString = "< 1.00 %";
        }
        var sequenceArray = d.ancestors().reverse();
        sequenceArray.shift();
        var last = typeof (sequenceArray[sequenceArray.length - 1]) !== "undefined" ? sequenceArray[sequenceArray.length - 1] : {};
        var converted = 0;
        var convertedAmmount = 0;
        //console.log(sequenceArray, d.value, percentage);
        if (typeof (last.children) !== "undefined") {
            last.children.forEach(function (co) {
                if (co.data.name == "Conversion") {//TODO: Adjust to nwe conversion
                    converted = (100 * co.value / last.value).toPrecision(2);
                    convertedAmmount = co.value;
                }
            });
        }
        this.updateDescription(sequenceArray, d.value, percentage, converted, convertedAmmount);
        this.updateBreadcrumbs(sequenceArray, d.value, percentage);
        // Fade all the segments.
        d3.selectAll("path")
            .style("opacity", 0.7);
        // Then highlight only those that are an ancestor of the current segment.
        d3.selectAll("path")
            .filter(function (node) {
                return (sequenceArray.indexOf(node) >= 0);
            })
            .style("opacity", 1);
    }

    // Restore everything to full opacity when moving off the visualization.
    mouseleave(d) {
        var that = this;
        // Hide the breadcrumb trail
        // Hide the breadcrumb trail
        d3.select("#trail")
            .style("visibility", "hidden");
        // Deactivate all segments during transition.
        this.svg.selectAll("path").on("mouseover", null);
        // Transition each segment to full opacity and then reactivate it.
        this.svg.selectAll("path")
            .transition()
            .duration(550)
            .style("opacity", 1);
        // .on("end",this.mouseover.bind(this));
        this.svg.selectAll("path").on("mouseover", that.mouseover.bind(that));
        d3.select(this.opt.selectors.description)
            .style("visibility", "hidden");
    }

    initializeBreadcrumbTrail() {
        // Add the svg area.
        var trail = d3.select(this.opt.selectors.breadcrumbs).append("svg:svg")
            .attr("width", this.opt.width)
            .attr("height", 70)
            .attr("id", "trail");
        // Add the label at the end, for the percentage.
        trail.append("svg:text")
            .attr("id", "endlabel")
            .style("fill", "#000");
    }

    // Generate a string that describes the points of a breadcrumb polygon.
    breadcrumbPoints(d, i) {
        var points = [];
        var b = this.opt.breadcrumbs;
        points.push("0,0");
        points.push(b.w + ",0");
        points.push(b.w + b.t + "," + (b.h / 2));
        points.push(b.w + "," + b.h);
        points.push("0," + b.h);
        if (i > 0) {
            points.push(b.t + "," + (b.h / 2));
        }
        return points.join(" ");
    }

    // format the descriptidaon string in the middle of the chart
    formatDescription(sequence, value, percentage) {
        return value + " (" + (percentage < 0.5 ? "< 0.5%" : percentage + "%") + ")";
    }

    updateDescription(sequence, value, percentage, converted, ammount) {
        if (converted) {
            d3.select("#converted").text(ammount + " (" + parseInt(converted) + "%)");
            d3.select("#conv-box").style("visibility", "");
        }
        else {
            d3.select("#conv-box").style("visibility", "hidden");
        }

        d3.select("#percentage")
            .text(this.formatDescription(sequence, value, percentage))
            .style("visibility", "");
        d3.select(this.opt.selectors.description).style("visibility", "");
    }

    // format the text at the end of the breadcrumbs
    formatBreadcrumbText(sequence, value, percentage) {
        if (sequence.length > 0 && _.has(sequence[sequence.length - 1].data, "conversion_type")) {
            return sequence[sequence.length - 1].data.conversion_type;
        } else {
            return ""
        }
        //return value + " (" + (percentage < 0.1 ? "< 0.1%" : percentage + "%") + ")";
    }

    // Update the breadcrumb trail to show the current sequence and percentage.
    updateBreadcrumbs(sequence, value, percentage) {
        var that = this;
        var b = this.opt.breadcrumbs;
        //console.log(that);
        // Data join; key function combines name and depth (= position in sequence).
        var trail = d3.select("#trail")
            .selectAll("g")
            .data(sequence, function (d) {
                return d.data.name + d.depth;
            });
        trail.exit().remove();
        // Add breadcrumb and label for entering nodes.
        var entering = trail.enter().append("svg:g");
        entering.append("svg:polygon")
            .attr("points", that.breadcrumbPoints.bind(this))
            .style("fill", function (d) {
                return that.getColor(d.data.name.split("/")[0], d.data.name.split("/")[1]);//that.opt.color(d.split("/")[0]);
            });
        entering.append("svg:text").each(function (d) {
            let jr = d.data.name.split("/");
            var svgText = d3.select(this)
                .attr("x", (b.w + b.t) / 2)
                .attr("y", b.h / 3)
                .attr("text-anchor", "middle")
                .attr("dy", "0.35em");
            for (var i = 0; i < jr.length; i++) {
                svgText.append("tspan")
                    .attr("x", (b.w + b.t) / 2)
                    .attr('dy', '1em')
                    .text(jr[i]);
            }
        });
        // Set position for entering and updating nodes.
        entering.merge(trail).attr("transform", function (d, i) {
            return "translate(" + i * (b.w + b.s) + ", 0)";
        });
        // Now move and update the percentage at the end.
        d3.select("#trail").select("#endlabel")
            .attr("x", (sequence.length + 0.6) * (b.w + b.s))
            .attr("y", b.h / 2)
            .attr("dy", "0.35em")
            .attr("text-anchor", "left")

            .text(that.formatBreadcrumbText(sequence, value, percentage));
        // Make the breadcrumb trail visible, if it's hidden.
        d3.select("#trail")
            .style("visibility", "");
    }

    updateLegend(elems) {
        var li = this.opt.legendField;

        var that = this;
        var len = elems.length * (li.h + li.s);

        //d3.select("#legend").selectAll("text").remove()
        d3.select("#legend").select("svg").attr("height", len);


        var update = d3.select("#legend").select("svg").selectAll("g").data(elems);


        var enter = update.enter()

        var enterG = enter.append("svg:g").attr("transform", function (d, i) {
            //console.log(d);
            return "translate(0," + eval(i * (li.h + li.s)) + ")";
        });
        enterG.each((e) => {
            console.log(e);
        }).append("svg:rect")
            .attr("rx", li.r)
            .attr("ry", li.r)
            .attr("width", li.w)

            .attr("height", li.h)

            .style("fill", function (d) {
                var color = that.getColor(d.split("/")[0], d.split("/")[1])
                // console.log("legend",d,color)

                return color;
                //that.opt.color(d.split("/")[0]);
            })
            .on("mouseover", that.mouseoverLegend)
            .on("mouseleave", that.mouseleaveLegend)
            .on("click", that.clickLegend.bind(this));

        enter.selectAll("rect").style("fill", function (d) {
            var color = that.getColor(d.split("/")[0])
            //console.log("legend",d,color)

            return color//that.opt.color(d.split("/")[0]);
        });

        enterG.append("svg:text")
            .attr("x", li.w / 2)
            .attr("y", li.h / 2)
            .attr("dy", "0.35em")
            .attr("text-anchor", "middle")
            .text(function (d) {
                //var n = that.getColor(d);
                //console.log(n)
                let tmp = d.split("/").join(" > ");
                return tmp;
            });

        var exit = update.exit();


        exit.transition().duration(1000).attr("x", 100).style("opacity", 0).remove();


        update.select("rect")
            .attr("rx", li.r)
            .attr("ry", li.r)
            .attr("width", li.w)
            .attr("height", li.h)
            .style("fill", function (d) {
                var color = that.getColor(d.split("/")[0])
                console.log("legend", d, color)

                return color//that.opt.color(d.split("/")[0]);
            });


        update.select("text")
            .attr("x", li.w / 2)
            .attr("y", li.h / 2)
            .attr("dy", "0.35em")
            .attr("text-anchor", "middle")
            .text(function (d) {
                //var n = that.getColor(d);
                //console.log(n)
                let tmp = d.split("/").join(" > ");
                return tmp;
            });

        update.merge(enter)
    }

    drawLegend(elems) {
        var that = this;
        console.info("Drawing Legend . . . ");
        // Dimensions of legend item: width, height, spacing, radius of rounded rect.
        var li = this.opt.legendField;

        var data = elems; // Object.entries(this.opt.colors);
        var len = data.length * (li.h + li.s);

        var legend = d3.selectAll(this.opt.selectors.legend).append("svg")
            .attr("width", li.w)
            .attr("height", len)
            .selectAll("svg").append("g")
            .data(data)
            .enter().append("svg:g")
            .attr("transform", function (d, i) {
                //console.log(d);
                return "translate(0," + eval(i * (li.h + li.s)) + ")";
            });
        d3.selectAll(this.opt.selectors.legend).selectAll("g").append("svg:rect")
            .attr("rx", li.r)
            .attr("ry", li.r)
            .attr("width", li.w)
            .attr("height", li.h)
            .style("fill", function (d) {
                return that.getColor(d.split("/")[0], d.split("/")[1]);//that.opt.color(d.split("/")[0]);
            })
            .on("mouseover", that.mouseoverLegend)
            .on("mouseleave", that.mouseleaveLegend)
            .on("click", that.clickLegend.bind(this));
        d3.selectAll(this.opt.selectors.legend).selectAll("g").append("svg:text")
            .attr("x", li.w / 2)
            .attr("y", li.h / 2)
            .attr("dy", "0.35em")
            .attr("text-anchor", "middle")
            .text(function (d) {
                //var n = that.getColor(d);
                //console.log(n)
                let tmp = d.split("/").join(" > ");
                return tmp;
            });

    }

    clickLegend(el) {
        let path = d3.select(this.opt.selectors.chart).selectAll("path")
            .filter(function (node) {
                return ( el == node.data.name);
            })
            .style("opacity", 0.5).transition().duration(200).style("opacity", 1);
    }

    mouseoverLegend(el) {
        d3.select(this).attr("stroke", "black").attr("stroke-width", 2).attr("stroke-dasharray", 5);
        let path = d3.select("#chart").selectAll("path")
            .filter(function (node) {
                return ( el == node.data.name);
            })
            .style("opacity", 1).transition().duration(100).style("opacity", 0.5).transition().duration(250).style("opacity", 1);
    }

    mouseleaveLegend(el) {
        d3.select(this).attr("stroke", "").attr("stroke-width", "").attr("stroke-dasharray", "");

    }

    getColor(name, name2 = undefined) {
        // var n = this.resolveStepName(name.trim());
        var colorNum = this.opt.colorsObjNum[name][name2];

        return this.opt.color(colorNum)
        try {

            if (!name2) {
                var color = this.opt.colors[name];
                return color;
            } else {
                var color = this.opt.colorsObj[name][name2];
                return color;
            }

        }
        catch (e) {
            console.log(e);
            return "#000000";
        }
    }

    resolveStepName(sname) {
        var res = "";
        if (sname) {
            try {
                switch (sname) {
                    case "Dir":
                        res = "Direct";
                        break;
                    case "Ref":
                        res = "Referer";
                        break;
                    case "Con":
                        res = "Conversion";
                        break;
                    case "Ons":
                        res = "Onsite";
                        break;
                    case "Dis":
                        res = "Display";
                        break;
                    case "Ema":
                        res = "Email";
                        break;
                    case "Soc":
                        res = "Social Media";
                        break;
                    case "root":
                        res = "Initial";
                        break;
                    case "LandingPage":
                        res = "Landing Page ";
                        break;
                    case "Social Media ":
                        res = "Social Media";
                        break;
                    case "Sea":
                        res = "Search";
                        break;
                    case "MicroCon.":
                        res = "Micro-Conv.";
                        break;
                    case "Email ":
                        res = "Email";
                        break;
                    case "Conversion ":
                        res = "Conversion";
                        break;
                    default:
                        return sname;
                }
                return res;
            }
            catch (err) {
                console.log(err);
            }
        }
        else {
            return sname;
        }
    }

    // Take a 2-column CSV and transform it into a hierarchical structure suitable
    // for a partition layout. The first column is a sequence of step names, from
    // root to leaf, separated by hyphens. The second column is a count of howw
    // often that sequence occurred.
    buildHierarchy(obj) {
        var that = this;
        var csv = obj;
        // obj = _.clone(obj);
        csv = _.filter(obj, (obje) => {
            return obje[0].split(">").length < 15;
        });
        var root = {"name": "root", "children": []};
        for (var i = 1; i < csv.length - 1; i++) {
            var sequence = csv[i][0];
            var size = +csv[i][1];
            var conType = csv[i][2];
            //console.log(csv[i])
            if (isNaN(size)) {
                break;
            }
            var parts = sequence.split(">");
            parts = _.map(parts, _.trim);
            parts = _.map(parts, function (a) {
                return that.resolveStepName(a);
            });
            var currentNode = root;
            for (var j = 0; j < parts.length; j++) {
                var children = currentNode["children"];
                var nodeName = parts[j];
                var childNode;
                if (j + 1 < parts.length) {
                    // Not yet at the end of the sequence; move down the tree.
                    var foundChild = false;
                    for (var k = 0; k < children.length; k++) {
                        if (children[k]["name"] == nodeName) {
                            childNode = children[k];
                            foundChild = true;
                            break;
                        }
                    }
                    // If we don't already have a child node for this branch, create it.
                    if (!foundChild) {
                        childNode = {"name": nodeName, "children": []};
                        children.push(childNode);
                    }
                    currentNode = childNode;
                }
                else {
                    // Reached the end of the sequence; create a leaf node.
                    childNode = {"name": nodeName, "children": [], "size": size, conversion_type: conType};
                    children.push(childNode);
                }
            }
        }


        return root;
    }
}


























