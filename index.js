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
    console.log('MySQL Connected!')
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
        num_phone: req.body.numero,
        medecin: req.body.selectedMedecin
    }

    let sql = `INSERT INTO patients (id_patient, first_name, last_name, email, login_password, num_phone, id_medecin_treat) VALUES (?, ?, ?, ?, ?, ?, ?)`;

    db.query(sql,[data.id_patient, data.first_name, data.last_name, data.email, data.login_password, data.num_phone, data.medecin],(error,results) => {
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

app.get('/getMedecinIdName', (req,res) => {
    let sql = 'SELECT id_medecin,first_name,last_name FROM medecin';
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

app.post('/createMedecin', (req, res)=>{
    const {prenom, nom, mail, num, num_rue, rue, code_postal, ville, mdp}= req.body
    sqlQueryAdress ="INSERT INTO adress(nb_street, street_name, post_code, city) VALUES (?, ?, ?, ?)"
    valuesMedecin = [nom, prenom, mail, num , mdp]
    db.query(sqlQueryAdress, [num_rue, rue, code_postal, ville], (err, result)=>{
        if(err){
            console.log(err)
        }
        else{
            sqlQueryMedecin = 'INSERT INTO medecin(first_name, last_name, email, login_password, num_phone, signature, id_adress) VALUES (?, ?, ?, ?, ?, "https://varices.ca/wp-content/uploads/2017/11/signature-dr-duclos.png", (SELECT id_adress from adress where nb_street=? and street_name=? and post_code = ?));'
            db.query(sqlQueryMedecin, [prenom, nom, mail, mdp, num, num_rue, rue, code_postal], (err, result)=>{
                if(err){
                    console.log(err)
                }
                res.json({message : "Medecin ajouté à la base de données avec succès !"})
            })
        }
    })
})

app.post('/login', (req, res)=>{
    const { mail, mdp} = req.body;

    const loginQueryMedecin = "SELECT * from medecin join adress on medecin.id_adress = adress.id_adress  where email = ? and login_password = ?"
    const values = [mail, mdp]
    db.query(loginQueryMedecin, [mail, mdp], (err, results)=>{
        if(err){
            console.log(err)
        }
        else if (results === null || results.length === 0){
            return res.status(400).json({error : 'No account found'})
        }
        const message = 'login successfull';
        const response = { message, results };
        return res.status(200).json(response)
    })

})



app.listen(5001, () => {
    console.log('Server started on port 5001');
});