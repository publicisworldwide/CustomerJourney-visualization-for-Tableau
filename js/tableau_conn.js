import _ from "../node_modules/lodash";

/**
 * Tableau Connector base class.
 * JS Plugin for extending Tableau over embedded customized visualisation.
 * It provides simple ETL-similar way to access data from the Tableau Dashboard over TableauJS.
 *
 * @constructor
 * @param {object} object with parameters given for each request to Tableau API
 * @param {function} transform_callback - callback function with is applied on the data before initialising the visualisation.
 * @param {function} onInit - Initial callback
 * @param {function} onUpdate - Update logic for the parameter change
 */
class TableauConnector {

    constructor(options,transform_callback, onInit, onUpdate) {
        console.info("Initializing Tableau Connector");

        let defaultOptions={
            maxRows: 0,
            ignoreSelection: false,
            includeAllColumns: true,
            ignoreAliases: true
        };

        this.opt.tableau_params = Object.assign({}, defaultOptions, options);


        //Flag set after the initialisation of the Viz
        this.graphInitialized = false;
        // mapping between header and the column index
        this.colIdxMaps = {};
        this.colIdxMaps.getColumnIdx = function (name) {
            try {
                return this[name];

            } catch (err) {
                console.warn("Could not find column name " + name + " in given dataset.");
                return -1;
            }
        };

        if (typeof (transform_callback) === "function") {
            this.transform_fn = transform_callback;
        } else {
            this.transform_fn = (data) => {
                return data
            }
        }
        //End callback
        this.init_callback = onInit;
        this.update_callback = onUpdate;

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

        console.log(data.getName());


        try {
            let transformed = this.transform_fn.bind(this, data.getData());
        } catch (err) {

            this.errorWrapped(err, function () {
                let msg= "Error while transforming the data";
                console.warn(msg)
                let body = document.getElementsByTagName("body")[0];
                body.append("<p id='err_log'>"+msg+"</p>")
            })
        }
        //var csv = json2csv({data: sunburstJourneyData});
        //console.log(transformed)

        if (!this.graphInitialized) {
            console.info("Initialising Viz!");

            this.graphInitialized = true;

            return this.init_callback.call(this, transformed)
        } else {

            return this.update_callback.call(transformed)

        }


    }

    updateChart() {
        return this.getCurrentWorksheet().getUnderlyingDataAsync(this.opt.tableau_params)
            .then(this.onData.bind(this), this.onDataLoadError.bind(this));
    }


    onDataLoadError(err) {

        let body = document.getElementsByTagName("body")[0];
        body.append("<p id='err_log'>"+err+"</p>")
        return console.err("Error during Tableau Async request: ", err);
    }

    initConnector() {
        var tableau = this.getTableau();

        console.info("Initialising Tableau Connector!")

        this.getCurrentWorksheet()
            .getUnderlyingDataAsync(this.opt.tableau_params).then(this.onData.bind(this));

        // ...and listen to filter adjustments of the side of the Tableau Dashboard
        //this.getCurrentViz().addEventListener(tableau.TableauEventName.PARAMETER_VALUE_CHANGE, this.updateChart.bind(this));
        return this.getCurrentViz().addEventListener(tableau.TableauEventName.FILTER_CHANGE, this.updateChart.bind(this));
    }
}

//Sunburst specific data transformation
function transform(data) {
    //Extract the journey record and it's frequency
    var cjStringIdx = this.colIdxMaps.getColumnIdx("Cj Full String");
    var frequencyIdx = this.colIdxMaps.getColumnIdx("Relevance");


    var sunburstJourneyData =
        _.chain(data.getData())
            .map((item) => {
                let con = item[frequencyIdx].value;
                let t = item[cjStringIdx].value;
                let jr = t; //.replace(/\s/g, "");
                let last = jr.split(">").pop();

                return [jr, con, last.split("/")[1]];
            }).value();


    if (sunburstJourneyData.length == 0) {
        throw "No data to visualize !"
    }
    console.info("There are :" + unique.length + " unique paths foud in the data");

    // Select only unique paths based on the cj_string which represents the journey
    return _.uniqBy(sunburstJourneyData, (s) => {
        return s[0]
    });


}


var tc = new TableauConnector({},transform,
    //On init
    (dt) => {

        var sb = new Sunburst({}, dt);
        window.viz = sb;
    },
    //On update
    (dt) => {
        console.info("Updating Data!");
        window.viz.updateData(dt);

    });
tc.initConnector();

