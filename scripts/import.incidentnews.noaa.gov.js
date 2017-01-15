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

// id,open_date,name,location,lat,lon,threat,tags,commodity,measure_skim,measure_shore,measure_bio,measure_disperse,measure_burn,max_ptl_release_gallons,posts,description

let query = `DELETE FROM Pads WHERE id = 'oilmap';`
let query2 = ` INSERT INTO Pads (id,name,writeId) VALUES ('oilmap','Incident Report Data','w8qeg12d21');`;
try
{
    connection.query(query);
    connection.query(query2);
}
catch (err)
{
    console.log(` ERR ${query} ${err}`);
}
let i = 0;
let errors = 0;
csv.fromPath(process.argv[2])
    .on("data", function (data)
    {

        data = data.map((dataItem) =>
        {
            return dataItem.replace(/['"]+/g, '')
        });

        let query = `
        INSERT INTO Markers (
        lat,
        lon,
        name,
        colour,
        size,
        incidentData,
        PadId,
        typeId)
        VALUES(
        '${data[4]}',
        '${data[5]}',
        '${data[2]}',
        'ff0000',
        '25',
        '${JSON.stringify(data)}',
        'oilmap',
        2
        );  `;

        if (data[4].length < 1 || data[5].length < 1)
        {
          errors++;
            console.log(` NO LATITUDE: ${query} `);
            return;
        }

        i++;
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

        return;
    })
    .on("end", function ()
    {
        connection.end();
        console.log(`Imported ${i} items to the map: oilmap. errors: ${errors}`);
    });
