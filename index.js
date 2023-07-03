const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql');
const cors = require('cors');
const { error, log } = require('console');

const app = express();
const nodemailer = require('nodemailer');
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
const db = mysql.createConnection({
    host: 'medical.mysql.database.azure.com',
    user: 'adminproject',
    password: 'MedicalSolution!',
    database: 'medic'
});

db.connect(err => {
    if (err) throw err;
    console.log('MySQL Connected!')
});

app.post('/addPrescription', (req, res) => {
    let data = {
        pName: req.body.numSecu,
        dosage: req.body.nbFoisParJour,
        medical: 'Dolipane'
    }

    let sql = "INSERT INTO test_table (pName,medical,dosage) VALUES (?,?,?)";
    db.query(sql, [data.pName, data.dosage, data.medical], (err, result) => {
        if (err) throw err;
        console.log(result);
        res.send('Prescription added...');
    });
});

app.post('/inscriptionStudent', (req, res) => {
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

    db.query(sql, [data.id_patient, data.first_name, data.last_name, data.email, data.login_password, data.num_phone, data.medecin], (error, results) => {
        if (error) {
            console.error(error);
            res.status(500).send("Error inserting into patient database.");
        } else {
            console.log('Data insert successfully in patient database.');
            res.send('Data insert successfully in patient database.');
        }
    });
});

app.post('/inscriptionPharmacie', (req, res) => {
    let data_pharma = {
        name_pharma: req.body.nom,
        email: req.body.email,
        login_password: req.body.mdp,
        num_phone: req.body.numero
    }
    let data_adress = {
        nb_street: req.body.nb_adresse,
        street_name: req.body.adresse,
        post_code: req.body.code_postale,
        city: req.body.city
    }

    let sql_adress = "INSERT INTO adress (street_name, post_code, city, nb_street) VALUES (?, ?, ?, ?)";

    db.query(sql_adress, [data_adress.street_name, data_adress.post_code, data_adress.city, data_adress.nb_street], (err, results) => {
        if (err) {
            console.log(err);
            res.status(500).send('Error inserting into adress database.');
            return;
        }

        let sql_pharama = "INSERT INTO pharmacie (name_pharma, email, login_password, num_phone, id_adress) VALUES (?, ?, ?, ?, LAST_INSERT_ID())";

        db.query(sql_pharama, [data_pharma.name_pharma, data_pharma.email, data_pharma.login_password, data_pharma.num_phone], (err, results) => {
            if (err) {
                console.log(err);
                res.status(500).send('Error inserting into pharmacie database.');
                return;
            }

            console.log('Data inserted successfully into pharmacie and adress databases.');
            res.send('Data inserted successfully into pharmacie and adress databases.');
        });
    });
});

app.get('/getDrugs', (req, res) => {
    let sql = 'SELECT * FROM drug';
    db.query(sql, (err, results) => {
        if (err) {
            console.log(err)
        }
        res.json(results);
    });
});

app.get('/getMedecinIdName', (req, res) => {
    let sql = 'SELECT id_medecin,first_name,last_name FROM medecin';
    db.query(sql, (err, results) => {
        if (err) {
            console.log(err);
        }
        res.json(results);
    });
});

app.post('/getPatient', (req, res) => {
    numSecu = req.body.numSecu
    let sqlQuery = "SELECT * from patients where id_patient = ?"
    db.query(sqlQuery, [numSecu], (err, results) => {
        if (err) {
            console.log(err)
            res.json({ message: "Une erreur s'est produite" })
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

app.post('/createMedecin', (req, res) => {
    const { prenom, nom, mail, num, num_rue, rue, code_postal, ville, mdp } = req.body
    sqlQueryAdress = "INSERT INTO adress(nb_street, street_name, post_code, city) VALUES (?, ?, ?, ?)"
    valuesMedecin = [nom, prenom, mail, num, mdp]
    db.query(sqlQueryAdress, [num_rue, rue, code_postal, ville], (err, result) => {
        if (err) {
            console.log(err)
        }
        else {
            sqlQueryMedecin = 'INSERT INTO medecin(first_name, last_name, email, login_password, num_phone, signature, id_adress) VALUES (?, ?, ?, ?, ?, "https://varices.ca/wp-content/uploads/2017/11/signature-dr-duclos.png", (SELECT id_adress from adress where nb_street=? and street_name=? and post_code = ?));'
            db.query(sqlQueryMedecin, [prenom, nom, mail, mdp, num, num_rue, rue, code_postal], (err, result) => {
                if (err) {
                    console.log(err)
                }
                res.json({ message: "Medecin ajouté à la base de données avec succès !" })
            })
        }
    })
})


app.post("/login", (req, res) => {
    const { mail, mdp } = req.body;

    const loginQueryMedecin = "SELECT * from medecin join adress on medecin.id_adress = adress.id_adress  where email = ? and login_password = ?"

    db.query(loginQueryMedecin, [mail, mdp], (err, results) => {
        if (results.length !== 0) {
            const message = 'login_medecin';
            const response = { message, results };
            return res.status(200).json(response)
        }
        else {
            const LoginQueryMedecinT = "S"



            const loginQueryUser = `SELECT id_patient, p.first_name, p.last_name, p.email, p.num_phone,id_medecin_treat,
    CASE
        WHEN id_medecin_treat IS NOT NULL THEN m.first_name
        ELSE NULL
    END AS first_name_medecin,
    CASE
        WHEN id_medecin_treat IS NOT NULL THEN m.last_name
        ELSE NULL
    END AS last_name_medecin,
    CASE
        WHEN id_medecin_treat IS NOT NULL THEN m.email
        ELSE NULL
    END AS email_medecin,
    CASE
        WHEN id_medecin_treat IS NOT NULL THEN m.num_phone
        ELSE NULL
    END AS num_phone_medecin
FROM patients p
LEFT JOIN medecin m ON id_medecin_treat = id_medecin
WHERE p.email = ? AND p.login_password = ?`

            db.query(loginQueryUser, [mail, mdp], (err, result) => {
                if (result.length !== 0) {
                    const message = 'login_user';
                    const response = { message, result };
                    return res.status(200).json(response)
                }
                else {
                    const loginQueryPharma = "SELECT * FROM medic.pharmacie where email = ? and login_password = ?;"
                    db.query(loginQueryPharma, [mail, mdp], (err, results) => {
                        if (results === null || results.length === 0) {
                            return res.status(400).json({ error: 'Pas de compte' })
                        }
                        const message = 'login_pharma';
                        const response = { message, results };
                        return res.status(200).json(response)
                    })


                }
            });
        }
    });
});

app.post("/addOrdonnance", (req, res) => {
    const { date, id_medecin, id_patient, infoMedicaments } = req.body;
    sqlQueryOrdo = "INSERT INTO ordonnance (date, id_medecin, id_patient) VALUES(CURDATE(), ?, ?);"
    db.query(sqlQueryOrdo, [id_medecin, id_patient], (error, result) => {
        if (error) {
            console.log(error)
        }
        else {
            for (let i = 0; i < infoMedicaments.length; i++) {
                sqlQueryOrdoMedicaments = "INSERT INTO ordonnance_drugs (id_drug, nb_fois_par_jour, nb_jour, id_ordo) VALUES(?,?,?,(SELECT id_ordo from ordonnance ORDER BY id_ordo desc  Limit 1));"
                db.query(sqlQueryOrdoMedicaments, [infoMedicaments[i][0], infoMedicaments[i][1], infoMedicaments[i][2]], (err, result) => {
                    if (err) {
                        console.log(err)
                    }
                })
            }
            return res.json({ message: "ORDONNANCE AJOUTEE AVEC SUCCES !" })
        }

    })

})

app.post("/getOrdonnances", (req, res) => {
    const id = req.body.id
    const role = req.body.role
    sqlGetOrdo = "SELECT o.id_ordo, o.date, o.id_medecin,m.first_name as medecin_first_name, m.last_name as medecin_last_name, m.num_phone as medecin_num_phone, a.nb_street, a.street_name, a.post_code, a.city, o.id_patient, p.first_name, p.last_name, p.num_phone, od.id_drug, d.name_drug, od.nb_fois_par_jour, od.nb_jour, a.street_name, a.city, a.post_code, a.nb_street from ordonnance o join  medecin m on o.id_medecin = m.id_medecin  join patients p on o.id_patient = p.id_patient join adress a on m.id_adress = a.id_adress join ordonnance_drugs od on o.id_ordo=od.id_ordo join drug d on od.id_drug = d.id_drug where o." + role + "= ?;"
    db.query(sqlGetOrdo, [id], (err, result) => {
        if (err) {
            console.log(err)
        }
        else {
            if (result === null || result.length === 0) {
                return res.json([])
            }
            else {
                return res.json(result)
            }
        }
    })
})

app.post("/getOrdonnancesPharma", (req, res) => {
    const id_pharma = req.body.id_pharma
    sqlGetOrdo = "SELECT ph.id_ordo_pharma, ph.id_pharma, ph.id_ordo, isComplete, o.id_ordo, o.date, o.id_medecin,m.first_name as medecin_first_name, m.last_name as medecin_last_name, m.num_phone as medecin_num_phone, a.nb_street, a.street_name, a.post_code, a.city, o.id_patient, p.first_name, p.last_name, p.num_phone, od.id_drug, d.name_drug, od.nb_fois_par_jour, od.nb_jour, a.street_name, a.city, a.post_code, a.nb_street from ordonnance_pharma ph join ordonnance o on ph.id_ordo=o.id_ordo join medecin m on o.id_medecin = m.id_medecin  join patients p on o.id_patient = p.id_patient join adress a on m.id_adress = a.id_adress join ordonnance_drugs od on o.id_ordo=od.id_ordo join drug d on od.id_drug = d.id_drug where ph.id_pharma= ?;"
    db.query(sqlGetOrdo, [id_pharma], (err, result) => {
        if (err) {
            console.log(err)
        }
        else {
            if (result === null || result.length === 0) {
                return res.json([])
            }
            else {
                return res.json(result)
            }
        }
    })
})

app.post("/getEtudiantsSuivi", (req, res) => {
    const id_medecin = req.body.id_medecin
    sqlGetEtudiants = "SELECT id_patient, first_name, last_name, email, num_phone, id_medecin_treat FROM medic.patients where id_medecin_treat=?;"
    db.query(sqlGetEtudiants, [id_medecin], (err, result) => {
        if (err) {
            console.log(err)
        }
        else {
            if (result === null || result.length === 0) {
                return res.json([])
            }
            else {
                return res.json(result)
            }
        }
    })
})



//Patient side
app.post("/sendOrdonnanceToPharma", (req, res) => {
    const id_pharma = req.body.id_pharma;
    const id_ordo = req.body.id_ordo;
    sql_ordoSending = "INSERT INTO ordonnance_pharma (id_pharma, id_ordo) VALUES (?, ?)"
    db.query(sql_ordoSending, [id_pharma, id_ordo], (err, result) => {

        if (err) {
            console.log(err);
            res.status(500).send('Error inserting into ordonnance_pharma database.').json({message: false});
            return ;
        }

        console.log('Data inserted into ordonnance_pharma succeed.');
        res.send('Data inserted into ordonnance_pharma succeed.');
    });
});

app.get('/getPharmacies', (req, res) => {
    let sql_getPharma = "SELECT id_pharma, name_pharma, email, num_phone, id_adress FROM pharmacie";
    db.query(sql_getPharma, (err,result) => {
        if (err){
            console.log(err);
            console.log("Error in getPharmacies");
            res.status(500).send("Error in getPharmacies")
        }else{
            res.json(result);
        }
    });
});

app.get('/getAddress', (req, res) => {
    sql_getPharma = "SELECT * FROM adress WHERE id_adress = ?";
    db.query(sql_getPharma, [req.query.id_adress], (err,result) => {
        if (err){
            console.log(err);
            res.status(500).send("Error in getAdress")
        }else{
            res.json(result);
        }
    });
});

app.post('/choseMedecinT', (req, res)=>{

})


//Pharma side
app.post("/getOrdonnancePharma", (req, res) => {
    const id_pharma = req.body.id;
    const role = req.body.role;
    sql_getOrdo = "SELECT * FROM ordonnance_pharma WHERE id_pharma = ?"
    db.query(sql_getOrdo, [id_pharma], (error, results) => {
        if (error) {
            console.log(error);
            res.status(500).send("Error getting data from ordonnance_pharma database.");
        } else {
            res.json(results);
        }
    });
});


//Pharma side
app.post("/completeOrdonnance", (req, res) => {
    const id_ordo_pharma = req.body.id_ordo_pharma
    sql_completeOrdo = "UPDATE ordonnance_pharma SET isComplete = 1 WHERE id_ordo_pharma = ? ;"
    db.query(sql_completeOrdo, [id_ordo_pharma], (error, results) => {
        if (error) {
            console.log(error);
            res.status(500).send("Error completing the ordonnance.");
        } else {
            res.send("Ordonnace complete")
        }
    });
});


app.listen(5001, () => {
    console.log('Server started on port 5001');
});

app.post('/sendemails', async (req, res, next) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'ordotech6@gmail.com',
      pass: 'hawgcjqeyiziepst'
    }
  });

  const { to, subject, text } = req.body; // Récupérer les données du body de la requête

  const mailOptions = {
    from: 'ordotech6@gmail.com',
    to: to, // utiliser l'adresse email provenant du front-end
    subject: subject, // utiliser le sujet provenant du front-end
    text: text // utiliser le texte provenant du front-end
  };

    transporter.sendMail(mailOptions, (err, data) => {
        if (err) {
            return res.json({ status: 'fail', message: err.toString() });
        }
        return res.json({ status: 'success', message: 'Email sent successfully' });
    });
});




















