import json2csv from "json2csv";
import underscore from "underscore" ;


var myChart = null
var sb = null


getTableau = function () {
    return parent.parent.tableau;
};
getCurrentViz = function () {
    return getTableau().VizManager.getVizs()[0];
};

getCurrentWorksheet = function () {
    return getCurrentViz().getWorkbook().getActiveSheet().getWorksheets()[0];
};


errorWrapped = function (context, fn) {
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
};


initChart = function () {
    var onDataLoadError, onDataLoadOk, tableau, updateChart;
    tableau = getTableau();

    console.log("Initialising Tableau !")
    onDataLoadError = (err) => {
        console.log("serer")
        return console.err("Error during Tableau Async request: ", err);
    };
    onDataLoadOk = function (table) {

        //SPECIFY THE VALUES THAT YOU WANT TO FILTEROUT


        var colIdxMaps = {};
        ref = table.getColumns();
        for (var j = 0, len = ref.length; j < len; j++) {
            c = ref[j];
            colIdxMaps[c.getFieldName()] = c.getIndex();
        }
        console.log("table.getColumns() :")

        console.log(table.getColumns());


        d3.selectAll("svg").exit().remove()

        ondata(table);


        //updateChartWithData(table);

        return true
    };


    updateChart = function () {
        return getCurrentWorksheet().getUnderlyingDataAsync({
            maxRows: 0,
            ignoreSelection: false,
            includeAllColumns: true,
            ignoreAliases: true
        })
            .then(onDataLoadOk, onDataLoadError);
    };

    onData = function (data) {
        try {
            var colIdxMaps = {};
            colIdxMaps.__proto__.getColumnIdx = function (name) {
                try {
                    table = this;
                    return table[name];

                } catch (err) {

                    return -1;
                }
            };

            columns = data.getColumns();
            // Build colIDxMap which maps column name with it's indicies
            for (j = 0, len = columns.length; j < len; j++) {
                c = columns[j];
                colIdxMaps[c.getFieldName()] = c.getIndex();
            }

            dt = data.getData();
            console.log(data.getName());


            sunburstJourneyData =
                _.chain(data.getData())
                    .map((item)=> {
                        let cjString = colIdxMaps.getColumnIdx("Cj Encoded String");
                        let conversionsAmmount = colIdxMaps.getColumnIdx("Converions");
                        let t = item[cjString].value;
                        let jr = _s(t).replaceAll(" ", "").value();
                        return [jr, conversionsAmmount];
                    }).value()

            var unique = _.uniq(sunburstJourneyData, (s) =>  s[0]);
            var csv = json2csv({data: unique});
            console.log(csv);

            if (!sb) {
                sb = new Sunburst();
                sb.setData(unique);
                console.log(this);
            } else {
                console.log(sb);
                sb.updateData(unique);
            }
            ;
            //sb.createVisualization
        } catch (err) {
            console.log(err);
        }

        return true;
    }

    var data;
    getCurrentWorksheet()
        .getUnderlyingDataAsync({
            ignoreSelection: false,
            maxRows: 0,
            includeAllColumns: false,
            ignoreAliases: true
        }).then(onData);


    return getCurrentViz().addEventListener(tableau.TableauEventName.MARKS_SELECTION, updateChart);
};


updateChartWithData = function (data) {
    console.log(this.appApi.myChart.getData());
    d3.select("svg").data(data);
    console.info(data);
}


toChartEntry = function (d) {

    let tmp = [];
    d.forEach((row)=> {
        if (row) {
            tmp.push(d[6]);

        }
    });
    return tmp;
};


$(window).load(()=> {
    this.appApi.initChart();
});


