// Import di tutti i package usati all'interno di questo file
const express = require('express'); // express per gestire la comunicazione fra client e server
const session = require('express-session'); // express-sessione per gestire le sessioni degli utenti
const fs = require('fs'); // fs per leggere e scrivere da file system
const path = require('path'); // path per creare e leggere le path di elementi nel file system
const { json } = require('stream/consumers');
const bcrypt = require('bcryptjs'); // bcryptjs per criptare le password da inserire nel DB (confronta anche quelle già presenti)
const cors = require('cors'); // cors per setuppare l'ambiente per la comunicazione tramite cookie
const connettiDB = require('./dataBase/mongo'); // package creato per la connessione al DB di mongodb
const MongoStore = require('connect-mongo'); // package per connettersi a mongodb e usarlo anche da server
const multer = require('multer'); // package per il salvataggio su memoria dei file
const sharp = require('sharp'); // package usato per la gestione delle immagini (controllo dimensione, formato...)
const cloudinary = require('cloudinary').v2; // packagee usato per la connessione a cloudinary e per gestire i suoi contenuti
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const streamifier = require('streamifier');
const url = require('url'); // package usato per la creazione e la gestione degli URL
require('dotenv').config(); // package usato per leggere le variabili d'ambiente dai file .env

const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger/swagger_output.json');

const app = express(); // Il server (app) usa express per la gestione degli eventi e delle chiamate
const PORT = process.env.PORT || 3000; // Porta sulla quale viene aperto il server (non necesseria su render)

const SECRET_KEY = process.env.SECRET_KEY; // Chiave segreta per la creazione dei cookie

/**
 * Configurazione dell'ambiente di cloudinary con l'uso delle loro API key per poter
 * salvare/cancellare le foto dal loro cloud mediante chiamate di metodi
 */
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_PUBLIC_API_KEY,
    api_secret: process.env.CLOUDINARY_SECRET_API_KEY,
});

/**
 * Setup dell'ambiente per gestire il passaggio delle credenziali fra client e server
 */
app.use(cors({
    origin: 'http://localhost:3000', // o il tuo dominio specifico
    credentials: true // Consente l'invio dei cookie con le richieste
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/**
 * Setup della sessione che si crea quando un utente esegue il login
 */
app.use(session({
    secret: `${SECRET_KEY}`,
    resave: false,
    saveUninitialized: false,
    // Salvataggio della sessione su mongoDB con tempo di autodistruzione
    store: MongoStore.create({
        mongoUrl: process.env.MONGO_URI,
        collectionName: 'sessions',
        ttl: 60 * 6 * 10,
        autoRemove: 'native'
    }),
    // Setup del cookie con data di scadenza
    cookie: {
        maxAge: 1000 * 60 * 6 * 10,
        secure: false,
        sameSite: 'lax'
    }
}));

app.use((req, res, next) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    next();
});

app.use((req, res, next) => {
    if (req.path.endsWith('.html') && req.path !== '/login.html' && req.path !== '/index.html' && req.path !== '/factions.html' && req.path !== '/minecraft_empire.html' && !req.session.isAuthenticated) {
        return res.redirect('/login.html');
    }
    next();
});

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// const isAuth = (req, res, next) => {
//     if (req.session.isAuth) {
//         next();
//     } else {
//         res.redirect('/login.html')
//     }
// }

app.get('/app/check-session', (req, res) => {
    if (req.session.isAuth) {
        res.json({ valid: true })
    } else {
        res.json({ valide: false, message: "Sessione scaduta, necessario login!", redirectTo: '/login.html' });
    }
});

// La seguente porzione di codice contiene le routes per i vari redirect
app.get('/', async (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
})

app.get('/accedi', (req, res) => {
    res.status(200).json({ success: true, redirectTo: '/login.html' });
})

// app.get('/registrazioneUtente', (req, res) => {
//     res.sendFile(path.join(__dirname, 'public', 'registrazione.html'));
// });

// Gestione delle pagine per i redirect di minecraft empire
app.get('/minecraft_empire', (req, res) => {
    res.status(200).json({ success: true, redirectTo: '/minecraft_empire.html' });
})

app.get('/factions', (req, res) => {
    res.status(200).json({ success: true, redirectTo: '/factions.html' });
})

app.get('/minecraft_empire/biomi', (req, res) => {
    res.status(200).json({ success: true, redirectTo: '/minecraftEmpire/biomi.html' });
})

app.get('/minecraft_empire/strutture', (req, res) => {
    res.status(200).json({ success: true, redirectTo: '/minecraftEmpire/strutture.html' });
})

app.get('/minecraft_empire/costruzioni', (req, res) => {
    res.status(200).json({ success: true, redirectTo: '/minecraftEmpire/costruzioni.html' });
})

// Gestione delle pagine per i redirect di factions
app.get('/factions/biomi', (req, res) => {
    res.status(200).json({ success: true, redirectTo: '/factions/biomi.html' });
})

app.get('/factions/strutture', (req, res) => {
    res.status(200).json({ success: true, redirectTo: '/factions/strutture.html' });
})

app.get('/factions/costruzioni', (req, res) => {
    res.status(200).json({ success: true, redirectTo: '/factions/costruzioni.html' });
})

// ------------------------------------------------------------------------------------------------------
// Get per ottenere i dati dell'utente della sessione attuale
app.get('/app/data/utente', (req, res) => {
    res.status(200).json({ success: true, message: req.session.user });
})

// ------------------------------------------------------------------------------------------------------
// Gestione dei vari selettori delle pagine -> dalla selezione dei server alla selezione delle 3 pagine per ciascuno
app.get('/app/dati/selettoriPagine', (req, res) => {
    const filePath = path.join(__dirname, 'data', 'selettoriPagine.json');

    fs.readFile(filePath, 'utf-8', (err, data) => {
        if (err) {
            console.error("Errore nella lettura del file JSON: ", err);
            return res.status(500).send("Errore server");
        }
        res.json(JSON.parse(data));
    })
});

app.get('/app/dati/serverSalvati', (req, res) => {
    const filePath = path.join(__dirname, 'data', 'elencoServer.json');

    fs.readFile(filePath, 'utf-8', (err, data) => {
        if (err) {
            console.error("Errore nella lettura del file JSON: ", err);
            return res.status(500).send("Errore server");
        }
        res.json(JSON.parse(data))
    });
})

function controllaData(giorno, mese, anno) {
    let giornoNum = parseInt(giorno);
    let meseNum = parseInt(mese);
    let annoNum = parseInt(anno);
    if (meseNum == 2) {
        if (annoNum % 400 == 0 || (annoNum % 4 == 0 && annoNum % 100 != 0)) {
            if (giornoNum > 29) { return false; }
        } else {
            if (giornoNum > 28) { return false; }
        }
    } else if (meseNum <= 7 && meseNum != 2) {
        if (meseNum % 2 == 0) {
            if (giornoNum > 30) { return false; }
        } else {
            if (giornoNum > 31) { return false; }
        }
    } else if (meseNum >= 8) {
        if (meseNum % 2 == 0) {
            if (giornoNum > 31) { return false; }
        } else {
            if (giornoNum > 30) { return false; }
        }
    }
    return true;
}

// -------------------------------------------------------------------------------------------------------
// Gestione dei biomi
app.get('/app/dati/biomiSalvati', async (req, res) => {
    try {
        const nomeServer = req.query.server;
        const dataBase = await connettiDB();
        const collezioneBiomiScoperti = dataBase.collection('biomi');

        const biomi = await collezioneBiomiScoperti.find({ server: nomeServer }).toArray();
        res.status(200).json(biomi);
    } catch (err) {
        console.error("Errore durante l'estrazione dei biomi: ", err);
        res.status(500).json({ success: false, error: "Errore server" });
    }
});

app.get('/app/dati/elencoBiomi', (req, res) => {
    const filePath = path.join(__dirname, 'data', 'elencoBiomi.json');
    fs.readFile(filePath, 'utf-8', (err, data) => {
        if (err) {
            console.error("Errore nella lettura del file JSON: ", err);
            return res.status(500).send({ success: false, error: "Errore server" });
        }
        res.json(JSON.parse(data));
    });
});

app.post('/app/inserisciBioma', async (req, res) => {
    let { nome, posizione, utente, data, descrizione, dimensione, privato, server } = req.body;
    try {
        let dataSplit = data.split("/");
        const controllo = controllaData(dataSplit[0], dataSplit[1], dataSplit[2]);

        if (!controllo) { res.status(500).json({ success: false, message: "Data errata" }); return; }

        const dataBase = await connettiDB();
        const collezioneBiomiScoperti = dataBase.collection('biomi');
        nome = nome.toLowerCase();

        const nuovoBioma = {
            nome,
            posizione,
            utente,
            data,
            descrizione,
            dimensione,
            privato,
            server
        };

        await collezioneBiomiScoperti.insertOne(nuovoBioma);
        res.status(200).json({ success: true, message: "Bioma aggiunto correttamente" });
    } catch (err) {
        console.error("Errore durante l'inserimento del bioma ", err);
        res.status(500).json({ success: false, error: "Errore server" });
    }
});

app.post('/app/cancellaBioma', async (req, res) => {
    let { nome, posizione, utente, data, server } = req.body;
    try {
        const dataBase = await connettiDB();
        const collezioneBiomiScoperti = dataBase.collection('biomi');

        if (utente != req.session.user.username) {return res.status(500).json({ success: false, message: "Utente non autorizzato" });}

        posizione = posizione.replace("Coordinate: ", "");
        utente = utente.replace("Scoperto da: ", "");
        data = data.replace("Data scoperta: ", "");

        var coordArray = posizione.slice(1, -1).split(',');
        collezioneBiomiScoperti.deleteOne({
            nome: nome.toLowerCase(),
            posizione: coordArray,
            utente: utente,
            data: data,
            server: server
        });
        res.status(200).json({ success: true, message: "Eliminazione dei dati avvenuta con successo" });
    } catch (err) {
        console.error("Errore durante la rimozione del bioma ", err);
        res.status(500).json({ success: false, error: "Errore server" });
    }
});

app.post('/app/datiBioma', async (req, res) => {
    let { nome, posizione, server } = req.body;
    try {
        const dataBase = await connettiDB();
        const collezioneBiomiScoperti = dataBase.collection('biomi');

        posizione = posizione.replace("Coordinate: ", "");

        var coordArray = posizione.slice(1, -1).split(',');
        let bioma = await collezioneBiomiScoperti.find({
            nome: nome.toLowerCase(),
            posizione: coordArray,
            server: server
        });
        res.status(200).json(await bioma.toArray());
    } catch (err) {
        console.error("Errore durante l'estrazione dei dati del bioma ", err);
        res.status(500).json({ success: false, error: "Errore server" });
    }
});

app.post('/app/modificaDatiBioma', async (req, res) => {
    const { vecchioNome, nome, vecchiaPos, posizione, utente, data, descrizione, privato, server } = req.body;
    try {
        let dataSplit = data.split("/");
        const controllo = controllaData(dataSplit[0], dataSplit[1], dataSplit[2]);

        if (utente != req.session.user.username) { return res.status(500).json({ success: false, message: "Utente non autorizzato" }); }

        if (!controllo) { res.status(500).json({ success: false, message: "Data errata" }); return; }

        const dataBase = await connettiDB();
        const collezioneBiomiScoperti = dataBase.collection('biomi');

        const filtro = {
            nome: vecchioNome,
            posizione: vecchiaPos,
            server: server
        };

        const aggiornamento = {
            $set: {
                nome: nome,
                posizione: posizione,
                utente: utente,
                data: data,
                descrizione: descrizione,
                privato: privato,
                server: server
            }
        }

        await collezioneBiomiScoperti.updateOne(filtro, aggiornamento);
        res.status(200).json({ success: true, message: "Aggiornamento dati avvenuto con successo" });
    } catch (err) {
        console.error("Errore durante la modifica dei dati del bioma ", err);
        res.status(500).json({ success: false, error: "Errore server" });
    }
});

// ------------------------------------------------------------------------------------------------------------
// Gestione delle strutture
app.get('/app/dati/elencoStrutture', (req, res) => {
    const pathFile = path.join(__dirname, 'data', 'elencoStrutture.json');
    fs.readFile(pathFile, 'utf-8', (err, data) => {
        if (err) {
            console.error("Errore nella lettura del file JSON: ", err);
            return res.status(404).json({ success: false, error: "Errore server" });
        }
        return res.json(JSON.parse(data));
    });
});

app.get('/app/dati/struttureSalvate', async (req, res) => {
    try {
        const nomeServer = req.query.server;
        const dataBase = await connettiDB();
        const collezioneStrutture = dataBase.collection('strutture');

        const strutture = await collezioneStrutture.find({ server: nomeServer }).toArray();
        res.status(200).json(strutture);
    } catch (err) {
        console.error("Errore durante l'estrazione delle struttur: ", err);
        res.status(500).json({ success: false, error: "Errore server" });
    }
});

app.post('/app/inserisciStruttura', async (req, res) => {
    let { nome, posizione, utente, data, descrizione, dimensione, privato, server } = req.body;
    try {
        let dataSplit = data.split("/");
        const controllo = controllaData(dataSplit[0], dataSplit[1], dataSplit[2]);

        if (!controllo) { res.status(500).json({ success: false, message: "Data errata" }); return; }

        const dataBase = await connettiDB();
        const collezioneStrutture = dataBase.collection('strutture');

        const nuovaStruttura = {
            nome,
            posizione,
            utente,
            data,
            descrizione,
            dimensione,
            privato,
            server
        };

        await collezioneStrutture.insertOne(nuovaStruttura);
        res.status(200).json({ success: true, message: "Struttura aggiunta con successo" });
    } catch (err) {
        console.error("Errore durante l'inserimento della struttura: ", err);
        res.status(500).json({ success: false, error: "Errore server" });
    }
});

app.post('/app/rimuoviStruttura', async (req, res) => {
    let { nome, posizione, utente, data, server } = req.body;
    try {
        const dataBase = await connettiDB();
        const collezioneStrutture = dataBase.collection('strutture');

        if (utente != req.session.user.username) {return res.status(500).json({ success: false, message: "Utente non autorizzato" });}

        posizione = posizione.replace("Coordinate: ", "");
        utente = utente.replace("Scoperto da: ", "");
        data = data.replace("Data scoperta: ", "");

        let coordArray = posizione.slice(1, -1).split(',');
        collezioneStrutture.deleteOne({
            nome: nome.toLowerCase(),
            posizione: coordArray,
            utente: utente,
            data: data,
            server: server
        });
        res.status(200).json({ success: true, message: "Eliminazione dei dati avvenuta con successo" });
    } catch (err) {
        console.error("Errore durante la rimozione della struttura ", err);
        res.status(500).json({ success: false, error: "Errore server" });
    }
});

app.post('/app/datiStruttura', async (req, res) => {
    let { nome, posizione, server } = req.body;
    try {
        const dataBase = await connettiDB();
        const collezioneStrutture = dataBase.collection('strutture');

        posizione = posizione.replace("Coordinate: ", "");

        var coordArray = posizione.slice(1, -1).split(',');
        let bioma = await collezioneStrutture.find({
            nome: nome.toLowerCase(),
            posizione: coordArray,
            server: server,
        });
        res.status(200).json(await bioma.toArray());
    } catch (err) {
        console.error("Errore durante l'estrazione dei dati della struttura ", err);
        res.status(500).json({ success: false, error: "Errore server" });
    }
});

app.post('/app/modificaDatiStruttura', async (req, res) => {
    const { vecchioNome, nome, vecchiaPos, posizione, utente, data, descrizione, privato, server } = req.body;
    try {
        let dataSplit = data.split("/");
        const controllo = controllaData(dataSplit[0], dataSplit[1], dataSplit[2]);

        if (utente != req.session.user.username) { return res.status(500).json({ success: false, message: "Utente non autorizzato" }); }

        if (!controllo) { res.status(500).json({ success: false, message: "Data errata" }); return; }
        const dataBase = await connettiDB();
        const collezioneStrutture = dataBase.collection('strutture');

        const filtro = {
            nome: vecchioNome,
            posizione: vecchiaPos,
            server: server
        };

        const aggiornamento = {
            $set: {
                nome: nome,
                posizione: posizione,
                utente: utente,
                data: data,
                descrizione: descrizione,
                privato: privato,
                server: server
            }
        }

        await collezioneStrutture.updateOne(filtro, aggiornamento);
        res.status(200).json({ success: true, message: "Aggiornamento dati avvenuto con successo" });
    } catch (err) {
        console.error("Errore durante la modifica dei dati della struttura ", err);
        res.status(500).json({ success: false, error: "Errore server" });
    }
});

// -----------------------------------------------------------------------------------------------------------
// Gestione delle costruzioni

const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'image/png') {
        cb(null, true);
    } else {
        cb(new Error('Solo file PNG sono ammessi'), false);
    }
};

const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
});

const getFolderName = (server) => {
    if (server === 'minecraft empire') {
        return 'minecraftEmpire/costruzioni';
    } else if (server === 'factions') {
        return 'factions/costruzioni';
    }
};

app.post('/app/data/upload-immagine', upload.single('immagine'), async (req, res) => {
    try {
        // 1. Check if file exists (Multer attaches it to req.file)
        if (!req.file) {
            return res.status(400).json({ success: false, message: "Nessun file immagine fornito." });
        }

        // 2. Get data from request
        const nome = req.body.nome; // Make sure 'nome' is sent in the request body
        const server = req.body.server; // Make sure 'server' is sent in the request body
        const fileBuffer = req.file.buffer; // Get the buffer from MemoryStorage
        const data = req.body.data;

        let dataSplit = data.split("/");
        const controllo = controllaData(dataSplit[0], dataSplit[1], dataSplit[2]);

        if (!controllo) { res.status(500).json({ success: false, message: "Data errata" }); return; }

        if (!nome || !server) {
            return res.status(400).json({ success: false, message: "Dati 'nome' e 'server' mancanti." });
        }

        // 3. Validate image dimensions using Sharp
        const metadata = await sharp(fileBuffer).metadata();
        if (metadata.width < 1920 || metadata.height < 1080) {
            // If validation fails, don't proceed with upload
            return res.status(400).json({
                success: false,
                message: `L'immagine deve essere almeno 1920x1080. Dimensioni rilevate: ${metadata.width}x${metadata.height}`
            });
        }

        // 4. (Optional) Compress image with Sharp
        const compressedBuffer = await sharp(fileBuffer)
            .png({ quality: 80, compressionLevel: 9 }) // Adjust quality/compression as needed
            .toBuffer();

        // 5. Manually upload the processed buffer to Cloudinary
        // Use upload_stream for buffers
        const stream = cloudinary.uploader.upload_stream(
            {
                folder: getFolderName(server),
                // Use the 'nome' from the request body as the base public_id.
                // Cloudinary automatically makes it unique if needed, or you can add timestamp/random string.
                public_id: nome,
                resource_type: 'image' // Explicitly set resource type
            },
            (error, result) => {
                if (error) {
                    console.error("Errore durante l'upload su Cloudinary:", error);
                    // Provide a more specific error message if possible
                    return res.status(500).json({
                        success: false,
                        message: `Errore durante l'upload su Cloudinary: ${error.message || 'Errore sconosciuto'}`
                    });
                }

                // 6. Send success response with Cloudinary URL
                console.log('Upload su Cloudinary riuscito:', result);
                res.json({
                    success: true,
                    message: 'Upload immagine riuscito!',
                    url: result.secure_url, // URL sicuro dell'immagine caricata
                    public_id: result.public_id // Public ID assegnato da Cloudinary
                });
            }
        );

        // Write the buffer to the stream to initiate the upload
        stream.end(compressedBuffer);

    } catch (err) {
        console.error("Errore nel gestore /app/data/upload-immagine:", err);

        // Handle specific errors (like Sharp errors or file filter errors)
        if (err instanceof multer.MulterError) {
            res.status(400).json({ success: false, message: `Errore Multer: ${err.message}` });
        } else if (err.message === 'Solo file PNG sono ammessi!') {
            res.status(400).json({ success: false, message: err.message });
        } else if (err.message.includes('Input buffer contains unsupported image format')) {
            res.status(400).json({ success: false, message: "Formato immagine non supportato da Sharp (assicurati sia PNG valido)." });
        }
        else {
            res.status(500).json({ success: false, message: `Errore interno del server: ${err.message || 'Errore sconosciuto'}` });
        }
    }
});

app.post('/app/inserisciCostruzione', async (req, res) => {
    let { nome, utente, posizione, data, descrizione, dimensione, privato, server, immagine } = req.body;
    nome = nome.toLowerCase();

    try {
        const dataBase = await connettiDB();
        const collezioneCostruzioni = dataBase.collection('costruzioni');

        const nuovaCostruzione = {
            nome,
            utente,
            posizione,
            data,
            descrizione,
            dimensione,
            privato,
            server,
            immagine
        };

        await collezioneCostruzioni.insertOne(nuovaCostruzione);
        res.status(200).json({ success: true, message: "Inserimento della costruzione avvenuto con successo" });
    } catch (err) {
        console.error("Errore nell'inserimento della costruzione: ", err);
        res.status(500).json({ success: false, error: "Errore server" });
    }
});

app.get('/app/dati/costruzioniSalvate', async (req, res) => {
    try {
        const nomeServer = req.query.server;
        const dataBase = await connettiDB();
        const collezioneCostruzioni = dataBase.collection('costruzioni');

        const costruzioni = await collezioneCostruzioni.find({ server: nomeServer }).toArray();
        res.status(200).json(costruzioni);
    } catch (err) {
        console.error("Errore durante l'estrazione delle struttur: ", err);
        res.status(500).json({ success: false, error: "Errore server" });
    }
});

function extractPublicIdFromUrl(imageUrl) {
    try {
        const parsedUrl = new url.URL(imageUrl);
        const pathSegments = parsedUrl.pathname.split('/');

        const uploadIndex = pathSegments.findIndex(segment => segment === 'upload');

        if (uploadIndex === -1 || uploadIndex + 1 >= pathSegments.length) {
            console.error("Cannot find 'upload' segment or path is too short in URL:", imageUrl);
            return null;
        }

        const potentialVersion = pathSegments[uploadIndex + 1];
        const startIndex = /v\d+/.test(potentialVersion) ? uploadIndex + 2 : uploadIndex + 1;

        if (startIndex >= pathSegments.length) {
            console.error("No segments found after 'upload' (and potential version) in URL:", imageUrl);
            return null;
        }

        const publicIdWithExtension = pathSegments.slice(startIndex).join('/');
        const fileExtension = path.extname(publicIdWithExtension);
        const publicId = publicIdWithExtension.replace(fileExtension, '');

        if (!publicId) {
            console.error("Could not extract a valid public_id from URL:", imageUrl);
            return null;
        }

        return publicId;
    } catch (error) {
        console.error("Error parsing Cloudinary URL:", error);
        return null;
    }
}

app.post('/app/rimuoviCostruzione', async (req, res) => {
    let { nome, posizione, utente, data, server, immagine } = req.body;
    try {
        const dataBase = await connettiDB();
        const collezioneCostruzioni = dataBase.collection('costruzioni');

        if (utente != req.session.user.username) {return res.status(500).json({ success: false, message: "Utente non autorizzato" });}

        if (!immagine) {
            return res.status(400).json({ success: false, message: "URL dell'immagine mancante nel corpo della richiesta." });
        }

        const publicId = extractPublicIdFromUrl(immagine);

        if (!publicId) {
            return res.status(400).json({
                success: false,
                message: "Impossibile estrarre il public_id dall'URL fornito. Assicurati che sia un URL Cloudinary valido."
            });
        }

        console.log(`Attempting to delete image with public_id: ${publicId}`);

        try {
            const result = await cloudinary.uploader.destroy(publicId, {
                resource_type: 'image'
            });

            console.log("Cloudinary deletion result:", result);

            if (result.result !== 'ok') {
                return res.status(500).json({ success: false, message: `Risultato inatteso da Cloudinary: ${result.result}` });
            }

        } catch (error) {
            console.error(`Errore durante la cancellazione dell'immagine (public_id: ${publicId}) da Cloudinary:`, error);
            return res.status(500).json({
                success: false,
                message: `Errore durante la cancellazione: ${error.message || 'Errore sconosciuto'}`
            });
        }

        posizione = posizione.replace("Coordinate: ", "");
        utente = utente.replace("Creata da: ", "");
        data = data.replace("Data scoperta: ", "");

        let coordArray = posizione.slice(1, -1).split(',');
        collezioneCostruzioni.deleteOne({
            nome: nome.toLowerCase(),
            posizione: coordArray,
            utente: utente,
            data: data,
            server: server
        });

        res.status(200).json({ success: true, message: "Eliminazione dei dati avvenuta con successo" });
    } catch (err) {
        console.error("Errore durante la rimozione della costruzione ", err);
        res.status(500).json({ success: false, error: "Errore server" });
    }
});

app.post('/app/datiCostruzione', async (req, res) => {
    let { nome, posizione, server } = req.body;
    try {
        const dataBase = await connettiDB();
        const collezioneCostruzioni = dataBase.collection('costruzioni');

        posizione = posizione.replace("Coordinate: ", "");

        var coordArray = posizione.slice(1, -1).split(',');
        let bioma = await collezioneCostruzioni.find({
            nome: nome.toLowerCase(),
            posizione: coordArray,
            server: server
        });
        res.status(200).json(await bioma.toArray());
    } catch (err) {
        console.error("Errore durante l'estrazione dei dati della struttura ", err);
        res.status(500).json({ success: false, error: "Errore server" });
    }
});

app.post('/app/modificaDatiCostruzione', async (req, res) => {
    const { nome, vecchiaPos, posizione, utente, data, descrizione, privato, server } = req.body;
    try {
        let dataSplit = data.split("/");
        const controllo = controllaData(dataSplit[0], dataSplit[1], dataSplit[2]);

        if (utente != req.session.user.username) { return res.status(500).json({ success: false, message: "Utente non autorizzato" }); }

        if (!controllo) { res.status(500).json({ success: false, message: "Data errata" }); return; }
        const dataBase = await connettiDB();
        const collezioneCostruzioni = dataBase.collection('costruzioni');

        const filtro = {
            nome: nome,
            posizione: vecchiaPos,
            server: server
        };

        const aggiornamento = {
            $set: {
                nome: nome,
                posizione: posizione,
                utente: utente,
                data: data,
                descrizione: descrizione,
                privato: privato,
                server: server
            }
        }

        await collezioneCostruzioni.updateOne(filtro, aggiornamento);
        res.status(200).json({ success: true, message: "Aggiornamento dati avvenuto con successo" });
    } catch (err) {
        console.error("Errore durante la modifica dei dati della struttura ", err);
        res.status(500).json({ success: false, error: "Errore server" });
    }
});

// ------------------------------------------------------------------------------------------------------------
// Gestione delle musiche di sottofondo presenti nel sito
app.get('/app/data/elencoMusiche', (req, res) => {
    const filePath = path.join(__dirname, 'data/elencoMusiche.json');
    fs.readFile(filePath, 'utf-8', (err, data) => {
        if (err) {
            console.error("Errore lato server nella lettura del file: ", err);
            return res.status(404).json({ success: false, message: "Errore nella lettura del file" });
        }
        return res.json(JSON.parse(data));
    })
});

// ------------------------------------------------------------------------------------------------------------
// Gestione dei login nel server

// Rooute provvisoria per la registrazione di un nuovo utente
// app.post('/registrazione', async (req, res) => {
//     const { username, password } = req.body;
//     try {
//         const dataBase = await connettiDB();
//         if (!username || !password) {
//             return res.status(400).json({ success: false, error: "Username e password sono richiesti" });
//         }

//         const collezioneUtenti = dataBase.collection('utenti');

//         const utenteEsistente = await collezioneUtenti.findOne({ username });

//         if (utenteEsistente) {
//             return res.status(409).json({ success: false, error: "Nome utente già esistente" });
//         }

//         const passwordCriptata = await bcrypt.hash(password, 10);

//         const nuovoUtente = {
//             username,
//             passwordCriptata
//         };

//         await collezioneUtenti.insertOne(nuovoUtente);
//         res.status(201).json({ success: true, message: "Registrazione avvenuta con successo" });
//     } catch (err) {
//         console.error("Errore durante la registrazione ", err);
//         res.status(500).json({ success: false, error: "Errore server" });
//     }
// });

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const dataBase = await connettiDB();
        if (!username || !password) {
            return res.status(400).json({ success: false, error: "Username e password sono richiesti" });
        }

        const collezioneUtenti = dataBase.collection('utenti');

        const utente = await collezioneUtenti.findOne({ username });

        if (!utente) {
            return res.status(401).json({ success: false, error: "Nome utente o password errati" });
        }

        const combaciaPass = await bcrypt.compare(password, utente.passwordCriptata);
        if (!combaciaPass) {
            return res.status(401).json({ success: false, error: "Nome utente o password errati" })
        }

        req.session.isAuth = true;
        req.session.user = {
            id: utente._id,
            username: utente.username
        };
        res.status(200).json({ success: true, messaggio: "Login riuscito con successo", redirectTo: "/" });
        delete req.session.redirectTo;
    } catch (err) {
        console.error("Errore durante il login ", err);
        res.status(500).json({ success: false, error: "Errore server" });
    }
});

app.get('/controllaSessione', (req, res) => {
    if (req.session && req.session.user) {
        res.json({ loggedIn: true, username: req.session.user });
    } else {
        res.json({ loggedIn: false });
    }
});

app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            res.status(500).json({ success: false, error: "Errore nel logout" });
        }
    });
    res.status(500).json({ success: true, redirectTo: "/login.html" });
});

app.use(express.static(path.join(__dirname, 'public')));

app.listen(PORT, () => {
    console.log(`Server attivo su http://localhost:${PORT}`);
})