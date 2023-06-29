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

app.post("/addOrdonnance", (req, res)=>{
    const {date, id_medecin, id_patient, infoMedicaments} = req.body;
    sqlQueryOrdo = "INSERT INTO ordonnance (date, id_medecin, id_patient) VALUES(CURDATE(), ?, ?);"
    db.query(sqlQueryOrdo, [id_medecin, id_patient], (error, result)=>{
        if(error){
            console.log(error)
        }
        else{
            for(let i=0; i<infoMedicaments.length;i++){
                sqlQueryOrdoMedicaments = "INSERT INTO ordonnance_drugs (id_drug, nb_fois_par_jour, nb_jour, id_ordo) VALUES(?,?,?,(SELECT id_ordo from ordonnance ORDER BY id_ordo desc  Limit 1));"
                db.query(sqlQueryOrdoMedicaments, [infoMedicaments[i][0], infoMedicaments[i][1], infoMedicaments[i][2]], (err, result)=>{
                    if(err){
                        console.log(err)
                    }
                })
            }
            return res.json({message : "ORDONNANCE AJOUTEE AVEC SUCCES !"})
        }

    })

})

app.post("/getOrdonnances", (req, res)=>{
    const id_medecin = req.body.id_medecin
    sqlGetOrdo = "SELECT o.id_ordo, o.date, o.id_medecin,m.first_name as medecin_first_name, m.last_name as medecin_last_name, m.num_phone as medecin_num_phone, a.nb_street, a.street_name, a.post_code, a.city, o.id_patient, p.first_name, p.last_name, p.num_phone, od.id_drug, d.name_drug, od.nb_fois_par_jour, od.nb_jour from ordonnance o join  medecin m on o.id_medecin = m.id_medecin  join patients p on o.id_patient = p.id_patient join adress a on m.id_adress = a.id_adress join ordonnance_drugs od on o.id_ordo=od.id_ordo join drug d on od.id_drug = d.id_drug where o.id_medecin = ?;"
    db.query(sqlGetOrdo, [id_medecin], (err, result)=>{
        if(err){
            console.log(err)
        }
        else{
            if (result === null || result.length === 0){
                return res.json([])
            }
            else{
                return res.json(result)
            }
        }
    })
})

app.post("/getEtudiantsSuivi", (req, res)=>{
    const id_medecin = req.body.id_medecin
    sqlGetEtudiants = "SELECT id_patient, first_name, last_name, email, num_phone, id_medecin_treat FROM medic.patients where id_medecin_treat=?;"
    db.query(sqlGetEtudiants, [id_medecin], (err, result)=>{
        if(err){
            console.log(err)
        }
        else{
            if (result === null || result.length === 0){
                return res.json([])
            }
            else{
                return res.json(result)
            }
        }
    })
})


app.listen(5001, () => {
    console.log('Server started on port 5001');
});