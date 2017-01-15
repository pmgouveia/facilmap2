var csv = require("fast-csv");
var config = require("../config");

var mysql = require('mysql');
var connection = mysql.createConnection(
{
    host: 'localhost',
    user: config.db.user,
    password: config.db.password,
    database: config.db.database
});
let padId = 'oilmap';
// id,open_date,name,location,lat,lon,threat,tags,commodity,measure_skim,measure_shore,measure_bio,measure_disperse,measure_burn,max_ptl_release_gallons,posts,description
let csvFields = ["id", "open_date", "name", "location", "lat", "lon", "threat", "tags", "commodity", "measure_skim", "measure_shore", "measure_bio", "measure_disperse", "measure_burn", "max_ptl_release_gallons", "posts", "description"];
// let csvFields = ["open_date", "location", "lat", "lon", "threat", "tags", "commodity", "measure_skim", "measure_shore", "measure_bio", "measure_disperse", "measure_burn", "max_ptl_release_gallons", "posts", "description"];
let csvFieldsFiltered = ["id", "name"];
let typeId = '@lastTypeId';

let queryCreatePad = createPad(padId, 'incident map');
let querycreateType = createType(padId, csvFields, csvFieldsFiltered);
let queryLastInsertedTypeId = `SET ${typeId} = LAST_INSERT_ID();`;
let deleteAll = `DELETE FROM Markers WHERE padId = '${padId}'; DELETE FROM Pads WHERE id = '${padId}';`;

let csvFilename = process.argv[2];

console.log(deleteAll);
console.log(queryCreatePad);
console.log(querycreateType);
console.log(queryLastInsertedTypeId);


let queryInsertAllMarkers = insertAllMarkers(padId, typeId, csvFilename, csvFields, csvFieldsFiltered);

function createType(padId, csvFields, csvFieldsFiltered)
{
    let fieldsDb = [];
    csvFields.forEach(
        field =>
        {
            if (csvFieldsFiltered.indexOf(field) === -1) /** NO NEED FOR THIS EXTRA FIELDS **/
                fieldsDb.push(
                {
                    "name": field,
                    "type": "input",
                    "default": "empty"
                });
        }
    );

    let MarkerType = {
        'name': 'incident',
        'type': 'marker',
        'defaultColour': '000000',
        'colourFixed': 1,
        'defaultSize': 32,
        'sizeFixed': 1,
        'defaultSymbol': 'transport_roundabout_clockwise',
        'symbolFixed': 1,
        // 'defaultWidth': NULL,
        // 'widthFixed': NULL,
        // 'defaultMode': NULL,
        // 'modeFixed': NULL,
        'fields': JSON.stringify(fieldsDb).replace(/[\\]+/g, '').replace(/[\"]+/g, '\"'),
        'padId': padId
    };
    // console.log(Object.keys(MarkerType));
    let fieldNames = `(${Object.keys(MarkerType).join(',')})`;
    let fieldValues = `('${Object.values(MarkerType).join('\',\'')}')`;

    return `
    update Markers set typeId = 1 WHERE padId = 'oilmap';
    DELETE FROM Types WHERE name = 'incident';
    INSERT INTO Types ${fieldNames} VALUES ${fieldValues};`;
}
// id,open_date,name,location,lat,lon,threat,tags,commodity,measure_skim,measure_shore,measure_bio,measure_disperse,measure_burn,max_ptl_release_gallons,posts,description


// id | name      | value       | markerId |
// +----+-----------+-------------+----------+
// |  1 | data      | estes dados |    29409 |
// |  2 | open_date | poisss      |    29409 |
// +----+-----------+-------------+----------+

function createPad(padId, padTitle)
{
    let query = `DELETE FROM Pads WHERE id = '${padId}';`
    let query2 = ` INSERT INTO Pads (id,name,writeId) VALUES ('${padId}','${padTitle}','${padId}Edit');`;

    return `${query}\n${query2}`;
}

function insertAllMarkers(padId, typeId, csvFilename, csvFields, csvFieldsFiltered)
{
    let i = 0;
    let errors = 0;
    csv.fromPath(csvFilename)
        .on("data", function (data)
        {
            data = data.map((dataItem) =>
            {
                return dataItem.replace(/['"]+/g, '');
            });
            // | id    | lat       | lon       | name            | colour | size | symbol                         | padId        | typeId | incidentData
            // | 29412 | 41.508575 |  0.000000 | Untitled marker | 000000 |   32 | transport_roundabout_clockwise | oilmap       |     30 | NULL         |
            // console.log(csvFields.indexOf('id'));
            // console.log(csvFields.indexOf('lat'));
            // console.log(data[csvFields.indexOf('lat')]);

            let query = `
        INSERT INTO Markers (
        lat,
        lon,
        name,
        colour,
        size,
        PadId,
        typeId)
        VALUES(
        '${data[csvFields.indexOf('lat')]}',
        '${data[csvFields.indexOf('lon')]}',
        '${data[csvFields.indexOf('name')]}',
        'ff0000',
        '25',
        '${padId}',
        ${typeId}
        );`;

            // connection.query(query);

            i++;

            if (i == 1)
            {
                return;
            }
            if (data[4].length < 1 || data[5].length < 1)
            {
                errors++;
                // console.log(` NO LATITUDE: ${query} `);
                // console.log('nooo ');
                return;
            }

            console.log(query);
            let queryLastInsertedTypeId = `SET @lastMarkerId = LAST_INSERT_ID();`;
            // connection.query(queryLastInsertedTypeId);
            console.log(queryLastInsertedTypeId);
            csvFields.forEach(
                fieldName =>
                {
                    if (csvFieldsFiltered.indexOf(fieldName) === -1) /** NO NEED FOR THIS EXTRA FIELDS **/
                    {
                        let queryInsertMarkerData = `INSERT INTO MarkerData VALUES (DEFAULT, '${fieldName}','${data[csvFields.indexOf(fieldName)]}',@lastMarkerId);`;
                        console.log(queryInsertMarkerData);
                        // connection.query(queryInsertMarkerData);
                    }
                }
            );


            /*

                        if (i == 1)
                        {
                            return;
                        }
                        //
                        //
                        connection.query(query, function (err, rows, fields)
                        {
                            if (err)
                            {
                                console.log(` ERR: ${err} ${query} `);
                                throw err;
                            }
                        });

                        return;*/
        })
        .on("end", function ()
        {
            // connection.end();
            console.log(`Imported ${i} items to the map: oilmap. errors: ${errors}`);
        });
}
