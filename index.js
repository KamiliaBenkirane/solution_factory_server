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

app.post('/inscriptionStudent',(req,res) => {
    let data = {
        id_patient: req.body.secu,
        first_name: req.body.prenom,
        last_name: req.body.nom,
        email: req.body.mail,
        login_password: req.body.mdp,
        num_phone: req.body,
        medecin: 1
    }

    let sql = "INSERT INTO patients VALUES ?";

    db.query(sql,[data],(error,results) => {
        if(error){
            console.error(error);
            res.status(500).send("Error inserting into patient database.");
        }else {
            console.log('Data insert successfully in patient database.');
            res.send('Data insert successfully in patient database.');
        }
    });
});

app.get('/getDrugs', (req,res) => {
    let sql = 'SELECT * FROM drug';
    db.query(sql,(err,results) => {
        if(err){
            console.log(err)
        }
        res.json(results);
    });
});

app.get('/getMedecin', (req,res) => {
    let sql = 'SELECT * FROM medecin';
    db.query(sql,(err,results) => {
        if(err) {
            console.log(err);
        }
        res.json(results);
    });
});

app.post('/getPatient', (req, res)=>{
    numSecu = req.body.numSecu
    let sqlQuery = "SELECT * from patients where id_patient = ?"
    db.query(sqlQuery, [numSecu], (err, results)=>{
        if(err){
            console.log(err)
            res.json({message : "Une erreur s'est produite"})
        }
        else {
            if (results === null || results.length === 0) {
                res.status(400).json({ message: "Ce numéro de sécurité sociale n'existe pas !" });
            } else {
                res.json(results);
            }
        }
    });
});



app.listen(5001, () => {
    console.log('Server started on port 5001');
});