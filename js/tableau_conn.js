import _ from "../node_modules/lodash";
import d3 from "../node_modules/d3v4";

class TableauConnector {

    constructor() {
        console.info("Initializing Tableau Connector");
        this.colIdxMaps = {};
        this.colIdxMaps.getColumnIdx = function (name) {
            try {
                return this[name];

            } catch (err) {
                console.warn("Could not find coulum " + name + " in given data");
                return -1;
            }
        };

        this.graphInitialized = false;
    }

    getTableau() {
        return parent.parent.tableau;
    }

    getCurrentViz() {
        return this.getTableau().VizManager.getVizs()[0];
    }

    getCurrentWorksheet() {
        return this.getCurrentViz().getWorkbook().getActiveSheet().getWorksheets()[0];
    }

    errorWrapped(context, fn) {
        return function () {
            var args, err;
            args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
            try {
                return fn.apply(null, args);
            } catch (error) {
                err = error;
                return console.error("Got error during '", context, "' : ", err);
            }
        };
    }

    onData(data) {

        var columns = data.getColumns();
        // Build colIDxMap which maps column name with it's indicies
        for (let j = 0, len = columns.length; j < len; j++) {
            let c = columns[j];
            this.colIdxMaps[c.getFieldName()] = c.getIndex();
        }
        try {
            let dt = data.getData();
            console.log(data.getName());
            var cjString = this.colIdxMaps.getColumnIdx("Cj Full String");
            var conversionsAmmount = this.colIdxMaps.getColumnIdx("Relevance");


            var sunburstJourneyData =
                _.chain(data.getData())
                    .map((item) => {
                        let con = item[conversionsAmmount].value;

                        let t = item[cjString].value;
                        let jr = t //.replace(/\s/g, "");
                        let last = jr.split(">").pop();

                        return [jr, con, last.split("/")[1]];
                    }).value();

            if (sunburstJourneyData.length == 0) {
                throw "No data to visualize !"
            }
            var unique = _.uniqBy(sunburstJourneyData, (s) => {
                return s[0]
            });
            //var csv = json2csv({data: sunburstJourneyData});
            console.log(unique.length);
            console.log(unique)
            if (!this.graphInitialized) {
                let sb = new Sunburst({}, unique);
                window.viz = sb;
                this.graphInitialized = true;
            } else {
                console.log("Updating Data!");

                window.viz.updateData(unique);
            }
            //sb.createVisualization
        } catch (err) {

            this.errorWrapped("Reading received data ", function () {
                let body = document.getElementsByTagName("body")[0]
                console.log("Wrapped")
            })
        }

        return true;
    }

    updateChart() {
        return this.getCurrentWorksheet().getUnderlyingDataAsync({
            maxRows: 0,
            ignoreSelection: false,
            includeAllColumns: true,
            ignoreAliases: true
        })
            .then(this.onData.bind(this), this.onDataLoadError.bind(this));
    }

    onDataLoadOk(table) {

        var ref = table.getColumns();
        for (var j = 0, len = ref.length; j < len; j++) {
            c = ref[j];
            this.colIdxMaps[c.getFieldName()] = c.getIndex();
        }
        console.log("table.getColumns() :");

        console.log(table.getColumns());


        onData(table);
        //updateChartWithData(table);

        return true;
    }

    onDataLoadError(err) {
        console.log("serer");
        return console.err("Error during Tableau Async request: ", err);
    }

    initConnector() {
        //var onDataLoadError, onDataLoadOk, tableau, updateChart;
        var tableau = this.getTableau();

        console.log("Initialising Tableau !")

        var data;
        this.getCurrentWorksheet()
            .getUnderlyingDataAsync({
                ignoreSelection: false,
                maxRows: 0,
                includeAllColumns: false,
                ignoreAliases: true
            }).then(this.onData.bind(this));


        return this.getCurrentViz().addEventListener(tableau.TableauEventName.FILTER_CHANGE, this.updateChart.bind(this));
    }
}


var tc = new TableauConnector();
tc.initConnector();

