const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const db = mysql.createConnection({
    host: 'medical.mysql.database.azure.com',
    user: 'adminproject',
    password: 'MedicalSolution!',
    database: 'medic'
});

db.connect(err => {
    if(err) throw err;
    console.log('MySQL Connected...')
});

app.post('/addPrescription',(req,res) =>{
    let data = {
        pName: req.body.numSecu,
        dosage: req.body.nbFoisParJour,
        medical: 'Dolipane'
    }

    let sql = "INSERT INTO test_table (pName,medical,dosage) VALUES (?,?,?)";
    db.query(sql, [data.pName,data.dosage,data.medical], (err, result) => {
        if(err) throw err;
        console.log(result);
        res.send('Prescription added...');
    });
});

app.get('/getDrugs', (req,res) => {
    let sql = 'SELECT * FROM drug';
    db.query(sql,(err,results) => {
        if(err) throw err;
        res.json(results);
    });
});


app.listen(5001, () => {
    console.log('Server started on port 5001');
});