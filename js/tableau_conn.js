import json2csv from '../node_modules/json2csv';
import underscore from "../node_modules/underscore";



class TableauConnector {

    constructor(){
        console.info("Initializing Tableau Connector");
        this. colIdxMaps = {};
        this.colIdxMaps.__proto__.getColumnIdx = function(name){
            try{
                table = this;
                return table[name];

            }catch(err){

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
        return function() {
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
    onData (data){
        try {


            var columns = data.getColumns();
            // Build colIDxMap which maps column name with it's indicies
            for (let j = 0, len = columns.length; j < len; j++) {
                c = columns[j];
                this.colIdxMaps[c.getFieldName()] = c.getIndex();
            }

            dt = data.getData();
            console.log(data.getName());


            sunburstJourneyData =
                _.chain(data.getData())
                    .map((item) => {
                        let con = item[conversionsAmmount].value;

                        let t = item[cjString].value;
                        let jr = _s(t).replaceAll(" ", "").value();
                        let last = jr.split(">").pop();

                        return [jr, con, last.split("/")[1]];
                    }).value();

            if(sunburstJourneyData.length === 0){
                throw RangeException("No data to visualize !");
            }
            var unique = _.uniq(sunburstJourneyData, (s) => s[0]);
            var csv = json2csv({data: sunburstJourneyData});
            console.log(sunburstJourneyData.length);
            console.log(sunburstJourneyData)
            if (graphInitialized) {
                let sb = new Sunburst({}, unique);
                window.viz = sb;
                this.graphInitialized= true;
            } else {
                console.log("Updating Data!");

                window.viz.updateData(sunburstJourneyData);
            }
            //sb.createVisualization
        } catch(err) {
            console.log(err);
        }

        return true;
    }
    updateChart() {
        return getCurrentWorksheet().getUnderlyingDataAsync({
            maxRows: 0,
            ignoreSelection: false,
            includeAllColumns: true,
            ignoreAliases: true
        })
            .then(this.onDataLoadOk, this.onDataLoadError);
    }
    onDataLoadOk(table) {

        //SPECIFY THE VALUES THAT YOU WANT TO FILTEROUT


       // var colIdxMaps = {};
        ref = table.getColumns();
        for (var j = 0, len = ref.length; j < len; j++) {
            c = ref[j];
            this.colIdxMaps[c.getFieldName()] = c.getIndex();
        }
        console.log("table.getColumns() :" );

        console.log(table.getColumns());


        d3.selectAll("svg").exit().remove();

        ondata(table);
        //updateChartWithData(table);

        return true;
    }

    onDataLoadError(err) {
        console.log("serer");
        return console.err("Error during Tableau Async request: ", err);
    }
    initChart() {
        //var onDataLoadError, onDataLoadOk, tableau, updateChart;
        tableau = this.getTableau();

        console.log("Initialising Tableau !")

        var data;
        getCurrentWorksheet()
            .getUnderlyingDataAsync({
                ignoreSelection: false,
                maxRows: 0,
                includeAllColumns: false,
                ignoreAliases: true
            }).then(this.onData);


        return getCurrentViz().addEventListener(tableau.TableauEventName.MARKS_SELECTION, this.updateChart);
    }


    updateChartWithData(data) {
        d3.select("svg").data(data);
        console.info(data);
    }
}



$(window).onload((el)=>{

    var tc = TableauConnector();
    tc.initChart();

});