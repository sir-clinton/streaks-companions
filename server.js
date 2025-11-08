const express = require('express');
const app = express();
const path = require('path');
const session = require('express-session');
const bcrypt = require('bcrypt');
const { getMissingFields } = require('./utils/profileCheck');
const BoostRequest = require('./models/BoostRequest');
const mongoose = require('mongoose');
const Escort = require('./models/Escorts');
const ProfileView = require('./models/profileviews');
require('dotenv').config();
const rateLimit = require('express-rate-limit');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const requestIp = require('request-ip');
// const fetch = require('node-fetch');
const fs = require('fs');
const NodeCache = require('node-cache');
const compression = require('compression');
const slugify = require('slugify');
app.use(compression()); //Compress responses to reduce payload size and speed up delivery:
app.set('trust proxy', 1); // Trust first proxy
console.log(process.env.EMAIL_USER);
 // Trust upstream proxy to correctly identify protocol (e.g., http vs https)

const logFilePath = path.join(__dirname, 'access.log');
const ipCache = new Map();

async function getLocation(ip) {
  if (ipCache.has(ip)) return ipCache.get(ip);

  try {
    const res = await fetch(`https://ipinfo.io/${ip}/json?token=97459bbaad3b97`);
    const data = await res.json();
    const location = `${data.city}, ${data.region}`;
    ipCache.set(ip, location);
    return location;
  } catch {
    return 'Unknown';
  }
}

app.use(async (req, res, next) => {
  const ip = requestIp.getClientIp(req);
  const ua = req.headers['user-agent'] || 'Unknown';
  const ref = req.headers['referer'] || 'Direct';
  const time = new Date().toISOString();

  let location = 'Unknown';

  try {
    location = await getLocation(ip);
  } catch (err) {
    console.error('GeoIP lookup failed:', err.message);
  }

  const logEntry = `[${time}] ${req.method} ${req.originalUrl} hit by ${ip} from ${location}\n` +
                   `↪ UA: ${ua}\n` +
                   `↪ Referrer: ${ref}\n\n`;

  fs.appendFile(logFilePath, logEntry, (err) => {
    if (err) console.error('Failed to write log:', err.message);
  });

  console.log(logEntry);
  next();
});


const escortCache = new NodeCache({ stdTTL: 1500 }); // 25 minutes = 1500 seconds
const homeCache = new NodeCache({ stdTTL: 40, checkperiod: 5})
const profileCache = new NodeCache({ stdTTL: 40, checkperiod: 5 });

// Limit: 5 attempts per 15 minutes per IP
const loginLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 5,
  message: {
    success: false,
    message: 'Too many login attempts. Please try after a few minutes later.'
  },
  standardHeaders: true, // Send rate limit info via headers
  legacyHeaders: false,  // Disable deprecated headers
});


app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.use(express.json({limit: '50mb', extended: true}));

app.use(express.urlencoded({extended: true}));
app.use(session({
    secret: 'secret-key',
    resave: false,
    saveUninitialized: true,
    cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
        secure: false, // Set to true if using HTTPS
        httpOnly: true ,// Prevents client-side JavaScript from accessing the cookie
        sameSite: 'strict' // Helps prevent CSRF attacks
    }
    }))
    app.use((req, res, next)=> {
        res.locals.loggedInEscort = req.session.escort || null;
        next();
    })



const PORT = 3000;

    // Now it's safe to use your model

let mongoConnected = false;

async function startServer() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');
    // mongoConnected = true;
    const escortsToDelete = ['Linsy','SALMA', 'YUSRA', 'Tasha', 'Shanny', 'britney', 'Nyaboke', 'FARIDA', 'ZUENA', 'NITS', 'Zoey', 'BigClit']
    
    // const result = await Escort.deleteMany({ name: { $in: escortsToDelete }});
    // console.log('deleted escorts', result.length)
    // const result = await Escort.insertOne(escort);
    // console.log('Escort inserted:', result);
    // const result = await Escort.insertMany(escorts, {ordered: false});
    // console.log('Escrts inserted:', result.length);
    async function verifyEmail(email) {
      try {
        if (!email || !email.includes('@')) {
          throw new Error('Invalid email format');
        }

        const normalizedEmail = email.trim().toLowerCase();
        const result = await Escort.updateOne(
          { email: normalizedEmail },
          { $set: { isVerified: true } }
        );

        if (result.modifiedCount === 0) {
          console.warn('No document was updated. Email may not exist.');
          return false;
        }

        console.log('Email verified successfully.');
        return true;

      } catch (err) {
        console.error('Update failed:', err);
        return false;
      }
}

    verifyEmail('muneneclinton159@gmail.com');
        // const result = await Escort.findOneAndUpdate(
        //     { name: 'Natasha' },
        //     {
        //         location: {
        //             type: 'Point',
        //             coordinates: [36.7606, -1.3969]
        //         }
        //     },
        //     { new: true }
        // );

        // if (result) {
        //     console.log(`Updated location for Natasha:`, result);
        // } else {
        //     console.log(`Escort named Natasha not found.`);
        // }

  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    mongoConnected = false;
    setTimeout(startServer, 10000); // backoff retry
  }
}

// const collectionsToClear = ['profiles', 'profileviews', 'escorts', 'boostrequests']; // Add your collection names

// mongoose.connection.once('open', async () => {
//   console.log('Connected to MongoDB');

//   try {
//     for (const name of collectionsToClear) {
//       const collection = mongoose.connection.collections[name];
//       if (collection) {
//         await collection.deleteMany({});
//         console.log(`Cleared collection: ${name}`);
//       } else {
//         console.log(`Collection not found: ${name}`);
//       }
//     }
//   } catch (err) {
//     console.error('Error clearing collections:', err);
//   } finally {
//     mongoose.connection.close();
//   }
// });

// Start server outside the Mongo connection
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  startServer(); // attempt MongoDB connection after Express is up
});

// Example: Find a profile
// const g = await Escort.findOne({ s: 'Sheila Starlight' });
// const l = await Escort.findOne({ d: req.session.escort.email });

// Example: Create a new profile
// const newEscort = new Escort({
//     name: 'New Escort',
//     email: '',
//     location: 'Nairobi',
//     age: 25,
//     password: 'password123',
       
//     userImg: 'https://example.com/image.jpg',
//     about: 'This is a new escort profile.',
//     location: 'Nairobi',
//     gallery: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg'],
//     phone: '1234567890',
//     socialLinks: {
//         instagram: 'https://instagram.com/newescort',
//         twitter: 'https://twitter.com/newescort',
//         facebook: 'https://facebook.com/newescort',
//         tiktok: 'https://tiktok.com/@newescort',
//     },
//     services: 'Massage, Companionship',
//     availability: 'Available 24/7',
//     ratings: 0,
//     reviews: 0,
//     isVerified: false,
//     isOnline: false,
//     isActive: true,
//     isPremium: false,
// }).save();


// Example: Save updates
// escort.location = req.body.location
// await escort.save()
// Escort.createIndexes({ name: 1 });
// Escort.createIndexes({ city: 1 });
// ProfileView.createIndexes({ profile: 1 });
// server.js (or wherever you configure your app)

const axios = require('axios');

async function submitToIndexNow(urls = []) {
  const payload = {
    host: 'pervnairobi.onrender.com',
    key: '8bc3f368987740bfb5dc914ffdfdbb43',
    keyLocation: 'https://pervnairobi.onrender.com/8bc3f368987740bfb5dc914ffdfdbb43.txt',
    urlList: urls
  };

  try {
    const res = await axios.post('https://api.indexnow.org/indexnow', payload);
    console.log('✅ IndexNow submitted:', res.status, urls);
  } catch (err) {
    console.error('❌ IndexNow error:', err.message);
  }
}

// Escort region URLs to submit
const urlsToSubmit = [
  'https://pervnairobi.onrender.com/city/Nairobi?gender=Female',
  'https://pervnairobi.onrender.com/city/Nairobi?gender=male',
  'https://pervnairobi.onrender.com/escorts-from-cbd',
  'https://pervnairobi.onrender.com/escorts-from-dandora',
  'https://pervnairobi.onrender.com/escorts-from-donholm',
  'https://pervnairobi.onrender.com/escorts-from-embakasi',
  'https://pervnairobi.onrender.com/escorts-from-githurai',
  'https://pervnairobi.onrender.com/escorts-from-juja',
  'https://pervnairobi.onrender.com/escorts-from-kabete',
  'https://pervnairobi.onrender.com/escorts-from-karen'
];

// Trigger submission
submitToIndexNow(urlsToSubmit);

const PRICING = {
  'bronze-weekly': 100,
  'silver-weekly': 200,
  'gold-weekly': 300,
  'bronze-monthly': 400,
  'silver-monthly': 800,
  'gold-monthly': 1200
};

const orderRank = { gold: 3, silver: 2, bronze: 1, null: 0 };

const getPureTier = (boostType = '') => {
  const parts = boostType.split('-');
  return parts[0]; // 'gold', 'silver', or 'bronze'
};

app.post('/save-location', async (req, res) => {
  try {
    const email = req.session?.escort?.email;
    const { latitude, longitude } = req.body;

    if (!email || !latitude || !longitude) {
      return res.status(400).json({ error: 'Missing required data' });
    }

    const escort = await Escort.findOneAndUpdate(
      { email },
      {
        location: {
          type: 'Point',
          coordinates: [longitude, latitude]
        }
      },
      { new: true }
    );

    if (!escort) {
      return res.status(404).json({ error: 'Escort not found' });
    }

    res.status(200).json({ message: 'Location saved', location: escort.location });
  } catch (err) {
    console.error('Error saving location:', err);
    res.status(500).json({ error: 'Internal server error' });
  }});

app.get('/health', (req, res) => {
  console.log('server is awake now (*_*)')
  res.status(200).json({ status: 'awake' });
});

app.get('/boost-request', (req, res) => {
  res.status(200).sendFile(path.join(__dirname, 'boostform.html'));
})
app.post('/boost-request', async (req, res) => {
  try {
    const { boostType, areaLabel, mpesaRef } = req.body;
    const pricePaid = PRICING[boostType] || 0;
    const escortId  = req.session?.escort?.id || "anonymous";

    const request = new BoostRequest({
      escort:     escortId,
      name: req.session?.escort?.name || null,
      boostType,
      pricePaid,         // ← record the actual cost
      areaLabel,
      mpesaRef,
      status:     "pending",
      timestamp:  new Date()
    });

    await request.save();
    res.send("Boost request received. Confirmation will follow.");
  }
  catch (err) {
    console.error(err);
    res.status(500).send("Error processing request.");
  }
});

function isAdmin(req, res, next) {
  if (req.session?.escort?.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Access denied. Admins only.' });
  }
}
app.get('/admin', isAdmin, (req, res) => {
  res.sendFile(path.join(__dirname, 'adminDashboard.html'));
});

app.post('/api/escorts', async (req, res) => {
  try {
    const escort = {
      ...req.body,
      publishedAt: new Date(),
      password: 'default123@()',
      backgroundImg: req.body.userImg, // optional: same image for now
    };

    const result = await Escort.create(escort);
    res.json({ success: true, escort: result });
  } catch (err) {
    console.error('Escort insert error:', err);
    res.status(500).json({ error: 'Failed to insert escort' });
  }
});

app.get('/dummy', (req, res)=> {
  res.sendFile(path.join(__dirname, 'dummyData.html'));
})

app.get('/admin/users', async (req, res) => {
  try {
  const users = await Escort.find({}).select('name email role isVerified _id').lean();
  res.status(200).json(users)
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: 'Failed to load users' });
  }
  
})

app.delete('/admin/delete-user/:id', isAdmin, async (req, res) => {
  try {
    const result = await Escort.findByIdAndDelete(req.params.id);
    if (!result) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    return res.json({ success: true, message: 'User deleted' });
  } catch (err) {
    console.error('Delete user error:', err);
  }
})

app.post('/admin/approve-boost/:id', isAdmin, async (req, res) => {
  try {
    const boost = await BoostRequest.findById(req.params.id);
    if (!boost) return res.status(404).send("Boost request not found.");

    // 🧠 Parse duration from boostType (e.g. 'gold-weekly' or 'silver-monthly')
    const [tier, duration] = boost.boostType?.split('-') || [];

    // ⏳ Determine expiration period
    let durationDays = 7; // default
    if (duration === 'monthly') durationDays = 30;
    else if (duration === 'weekly') durationDays = 7;

    // 🗓️ Approve and set expiry
    boost.status = 'confirmed';
    boost.expiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);
    await boost.save();

    res.json({
      success: true,
      message: `Boost confirmed (${tier}, ${duration}) and expires in ${durationDays} days.`
    });

  } catch (err) {
    console.error('Error approving boost:', err);
    res.status(500).json({ success: false, error: 'Server error during boost approval.' });
  }
});


app.get('/admin/boosts', async (req, res) => {
  try {
    const boostedUsers = await BoostRequest.find({ status: 'pending' })
      .select('escort name timestamp mpesaRef status expiresAt boostType')
      .lean();

    const now = new Date();
    const formatted = boostedUsers.map(b => {
      const [tier, duration] = b.boostType?.split('-') || ['N/A', 'N/A'];
      return {
        ...b,
        tier,
        duration,
        daysRemaining: b.expiresAt
          ? Math.max(0, Math.ceil((new Date(b.expiresAt) - now) / (1000 * 60 * 60 * 24)))
          : '—'
      };
    });

    res.status(200).json(formatted);
  } catch (err) {
    console.error(err);
    res.json([]);
  }
});

const areas = {
  Nairobi: [
    "Kilimani", "Westlands", "Karen", "CBD", "Roysambu", "Ngara", "Donholm", "Nairobi West", "Dandora", "Ojijo", "Yaya", "Sarit",
    "Ruaka", "Syokimau", "Kitengela", "Embakasi", "South B", "South C", "Lavington", "Parklands"
  ],
  Kiambu: [
    "Juja", "Kikuyu", "Ruiru", "Githurai",
    "Thika", "Limuru", "Kabete", "Tigoni"
  ]
  // Additional counties and areas can be uncommented and added here
};

// Create slug-to-area mapping
const slugToAreaMap = {};
Object.entries(areas).forEach(([city, areaList]) => {
  areaList.forEach(area => {
    const slug = slugify(area, { lower: true });
    slugToAreaMap[slug] = area;
  });
});

app.get('/escorts-from-:slug', async (req, res) => {
  const slug = req.params.slug;
  const area = slugToAreaMap[slug];
  const city = Object.entries(areas).find(([_, arr]) => arr.includes(area))?.[0] || 'Nairobi';

  if (!area) {
    return res.status(404).send('Area not found');
  }

  try {
    const escortEmail = req.session?.escort?.email;
    const escort = escortEmail ? await Escort.findOne({ email: escortEmail }) : null;
    const escorts = await Escort.find({
      areaLabel: { $regex: new RegExp(area, 'i') },
      allowedtopost: true
    }).lean();

    const boosts = await BoostRequest.find({
      status: 'confirmed',
      expiresAt: { $gt: new Date() }
    }).select('escort boostType').lean();

    const boostMap = boosts.reduce((map, b) => {
      map[b.escort.toString()] = b.boostType;
      return map;
    }, {});

    const ranked = escorts.map(e => {
      let age = null;
      if (e.dob) {
        const bd = new Date(e.dob), today = new Date();
        age = today.getFullYear() - bd.getFullYear();
        const m = today.getMonth() - bd.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < bd.getDate())) age--;
      }
      return {
        ...e,
        age,
        isBoosted: Boolean(boostMap[e._id.toString()]),
        boostType: boostMap[e._id.toString()] || null
      };
    });

    const boosted = ranked.filter(e => e.isBoosted).sort(
      (a, b) => orderRank[getPureTier(b.boostType)] - orderRank[getPureTier(a.boostType)]
    );

    const normal = ranked.filter(e => !e.isBoosted);
    for (let i = normal.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [normal[i], normal[j]] = [normal[j], normal[i]];
    }

    const finalList = [...boosted, ...normal];

    const meta = generateMeta(area, city, req);

    if (!finalList.length) {
      return res.render('index', {
        escorts: [],
        loggedInEscort: escort,
        message: `No profiles in ${area} yet.`,
        meta,
        city
      });
    }

    res.render('index', {
      escorts: finalList,
      loggedInEscort: escort,
      message: null,
      meta,
      city
    });

  } catch (err) {
    console.error(`Error fetching from ${area}:`, err);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/areas-with-counts', async (req, res) => {
  console.log(`[${new Date().toISOString()}] Home route hit by ${req.ip}`);
  

    const resultEntries = await Promise.all(
    Object.entries(areas).map(async ([city, areas]) => {
      const areaCounts = await Promise.all(
        areas.map(async (area) => {
          const count = await Escort.countDocuments({
            areaLabel: { $regex: `^${area}$`, $options: 'i' },
            allowedtopost: true
          });
          return { name: area, count };
        })
      );
      return [city, areaCounts];
    })
  );

  const result = Object.fromEntries(resultEntries);

  res.json(result);
});

const DEFAULT_IMAGE = 'https://storge.pic2.me/c/1360x800/717/55661ae60b86a.jpg';

app.get('/author/:name', async (req, res) => {
  const username = req.params.name;
  if (!username) {
    return res.status(400).json({ error: 'Profile name is required' });
  }

  try {
    const escortEmail = req.session?.escort?.email;
    const author = escortEmail ? await Escort.findOne({ email: escortEmail }) : null;
    const cacheKey = `profile_${username}`;
    let cached = profileCache.get(cacheKey);
    let escort, similarEscorts;

    if (cached) {
      escort = cached.escort;
      similarEscorts = cached.similarEscorts;
    } else {
      const doc = await Escort.findOne({ name: username, allowedtopost: true }).lean();
      if (!doc) {
        return res.status(404).json({ error: 'Profile not found' });
      }

      if (doc.dob) {
        const today = new Date();
        const bd = new Date(doc.dob);
        let age = today.getFullYear() - bd.getFullYear();
        const m = today.getMonth() - bd.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < bd.getDate())) age--;
        doc.age = age;
      }

      if (typeof doc.weight === 'string') {
        doc.weight = Number(doc.weight);
      }

      doc.userImg = doc.userImg?.trim() || DEFAULT_IMAGE;
      doc.backgroundImg = doc.backgroundImg?.trim() || DEFAULT_IMAGE;
      doc.about = doc.about?.trim() || 'No bio available.';
      escort = doc;

      const cityRegex = new RegExp(escort.city, 'i');
      const locationRegex = new RegExp(escort.areaLabel, 'i');

      const candidates = await Escort.find({
        allowedtopost: true,
        _id: { $ne: escort._id },
        city: cityRegex,
        areaLabel: locationRegex
      }).select('name userImg city areaLabel gender dob weight backgroundImg services').lean();

      const candidateIds = candidates.map(c => c._id);
      const boosts = await BoostRequest.find({
        status: 'confirmed',
        expiresAt: { $gt: new Date() },
        escort: { $in: candidateIds }
      }).select('escort boostType').lean();

      const boostMap = boosts.reduce((map, b) => {
        map[b.escort.toString()] = b.boostType;
        return map;
      }, {});

      const boostedArr = [], normalArr = [];

      candidates.forEach(c => {
        if (c.dob) {
          const today = new Date();
          const bd = new Date(c.dob);
          let age = today.getFullYear() - bd.getFullYear();
          const m = today.getMonth() - bd.getMonth();
          if (m < 0 || (m === 0 && today.getDate() < bd.getDate())) age--;
          c.age = age;
        }

        if (typeof c.weight === 'string') {
          c.weight = Number(c.weight);
        }

        c.userImg = c.userImg?.trim() || DEFAULT_IMAGE;
        c.backgroundImg = c.backgroundImg?.trim() || DEFAULT_IMAGE;
        c.about = c.about?.trim() || 'No bio available.';

        c.isBoosted = Boolean(boostMap[c._id.toString()]);
        c.boostType = boostMap[c._id.toString()] || null;

        (c.isBoosted ? boostedArr : normalArr).push(c);
      });

      boostedArr.sort((a, b) =>
        orderRank[getPureTier(b.boostType)] - orderRank[getPureTier(a.boostType)]
      );

      for (let i = normalArr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [normalArr[i], normalArr[j]] = [normalArr[j], normalArr[i]];
      }

      similarEscorts = [...boostedArr, ...normalArr].slice(0, 4);

      profileCache.set(cacheKey, { escort, similarEscorts });
    }

    function normalizeIp(ip) {
      if (!ip) return '';
      return ip.replace(/^::ffff:/, '').replace(/^::1$/, '127.0.0.1');
    }

    const viewerIp = normalizeIp(
      req.headers['x-forwarded-for']?.split(',')[0] || req.socket?.remoteAddress
    );

    await ProfileView.findOneAndUpdate(
      { profile: escort._id, ipAddress: viewerIp },
      { $setOnInsert: { viewedAt: new Date() } },
      { upsert: true, new: true }
    );

    const totalViews = await ProfileView.countDocuments({ profile: escort._id });
    escort.totalViews = totalViews;
    console.log(`User checked on ${escort} profile`);

    res.render('profile', { escort, similarEscorts, loggedInEscort: author });

  } catch (err) {
    console.error('Error in /author/:name route:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/analytics/:escortId', async (req, res) => {
  const { escortId } = req.params;
  const { start, end } = req.query;

  // ✅ Escort must be logged in
  if (!req.session.escort) {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  if (!start && !end) {
    return res.render('escortAnalytics');
  }
  // ✅ Validate date range
  if (!start || !end || isNaN(Date.parse(start)) || isNaN(Date.parse(end))) {
    return res.status(400).json({ error: 'Valid start and end dates required.' });
  }

  try {
    const views = await ProfileView.aggregate([
      {
        $match: {
          profile: new mongoose.Types.ObjectId(escortId),
          viewedAt: {
            $gte: new Date(start),
            $lte: new Date(end)
          }
        }
      },
      {
        $group: {
          _id: {
            day: { $dayOfMonth: "$viewedAt" },
            month: { $month: "$viewedAt" },
            year: { $year: "$viewedAt" }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: {
          "_id.year": 1,
          "_id.month": 1,
          "_id.day": 1
        }
      }
    ]);

    res.json({ views });
  } catch (err) {
    console.error('Analytics error:', err);
    res.status(500).json({ error: 'Failed to fetch analytics.' });
  }
});

const nearbyCache = new NodeCache({ stdTTL: 1800 }); // 30 mins

app.get('/nearby', async (req, res) => {
  const { lat, lng, distance = 5000 } = req.query;

  const cacheKey = `nearby_${lat}_${lng}_${distance}`;

  // Validate coordinates
  if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid coordinates.'
    });
  }

  // Check cache
  const cached = nearbyCache.get(cacheKey);
  if (cached) {
    return res.json({
      success: true,
      escorts: cached,
      center: { lat, lng },
      radius: distance,
      meta: {
        title: `Nearby Verified Escorts | Streak.com`,
        description: `Explore Nearby verified Escorts available in your area.`,
        image: cached[0]?.userImg || '/default-preview.jpg',
        url: req.protocol + '://' + req.get('host') + req.originalUrl
      }
    });
  }

  try {
    const escortEmail = req.session?.escort?.email;
    const escort = escortEmail ? await Escort.findOne({ email: escortEmail }) : null;

    let escorts = await Escort.find({
      allowedtopost: true,
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)]
          },
          $maxDistance: parseInt(distance)
        }
      }
    }).lean();

    // Get boosts (optional, if you want prioritization)
    const boosts = await BoostRequest.find({
      status: 'confirmed',
      expiresAt: { $gt: new Date() }
    }).select('escort boostType').lean();

    const boostMap = boosts.reduce((map, b) => {
      map[b.escort.toString()] = b.boostType;
      return map;
    }, {});

    // Final escort processing
    escorts = escorts
      .filter(e => e.about && e.userImg && e.name && e.location)
      .map(e => {
        // Age calculation
        let age = null;
        if (e.dob) {
          const bd = new Date(e.dob);
          const today = new Date();
          age = today.getFullYear() - bd.getFullYear();
          const m = today.getMonth() - bd.getMonth();
          if (m < 0 || (m === 0 && today.getDate() < bd.getDate())) age--;
        }
        return {
          ...e,
          age,
          isBoosted: Boolean(boostMap[e._id.toString()]),
          boostType: boostMap[e._id.toString()] || null
        };
      });

    // Sort and shuffle escorts
    const boosted = escorts
      .filter(e => e.isBoosted)
      .sort((a, b) => orderRank[getPureTier(b.boostType)] - orderRank[getPureTier(a.boostType)]);

    const normal = escorts.filter(e => !e.isBoosted);
    for (let i = normal.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [normal[i], normal[j]] = [normal[j], normal[i]];
    }

    const finalList = [...boosted, ...normal];

    // Store in cache
    nearbyCache.set(cacheKey, finalList);
    console.log(`Found ${escorts.length} escorts near (${lat}, ${lng})`);

    // Respond
    res.json({
      success: true,
      escorts: finalList,
      center: { lat: parseFloat(lat), lng: parseFloat(lng) },
      radius: parseInt(distance),
       meta: {
        title: `Nearby Verified Escorts | Streak.com`,
        description: `Explore Nearby verified Escorts available in your area.`,
        image: finalList[0]?.userImg || '/default-preview.jpg',
        url: req.protocol + '://' + req.get('host') + req.originalUrl
      }
    });

  } catch (err) {
    console.error('Nearby search error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch nearby escorts.'
    });
  }
});

app.get('/agencies', async (req, res) => {
  try {
    // Fetch escorts linked to agencies and allowed to post
    let escorts = await Escort.find({
      agencyName: { $exists: true, $ne: '' },
      allowedtopost: true
    }).lean();
    const escortEmail = req.session?.escort?.email;
    const escort = escortEmail ? await Escort.findOne({ email: escortEmail }) : null;
    if (escorts.length <= 0) {
       return res.render('index', {
          escorts: [],
          loggedInEscort: escort || null,
          message: 'No agencies found. Check back later.',
          meta: {
          title: `Explore verified escort and call agencies | Streak.com`,
          description: `Browse hot and verified profiles from top agencies for best massages, companionship, and more.`,
          image: finalList[0]?.userImg || '/default-preview.jpg',
          url: req.protocol + '://' + req.get('host') + req.originalUrl
        }
        });
    }

    // Fetch boost data
    const boosts = await BoostRequest.find({
      status: 'confirmed',
      expiresAt: { $gt: new Date() }
    }).select('escort boostType').lean();

    const boostMap = boosts.reduce((map, b) => {
      map[b.escort.toString()] = b.boostType;
      return map;
    }, {});

    // Normalize escort profiles
    escorts = escorts
      .filter(e => e.about && e.userImg && e.name && e.location)
      .map(e => {
        // Age calculation
        let age = null;
        if (e.dob) {
          const bd = new Date(e.dob);
          const today = new Date();
          age = today.getFullYear() - bd.getFullYear();
          const m = today.getMonth() - bd.getMonth();
          if (m < 0 || (m === 0 && today.getDate() < bd.getDate())) age--;
        }

        return {
          ...e,
          age,
          isBoosted: Boolean(boostMap[e._id.toString()]),
          boostType: boostMap[e._id.toString()] || null
        };
      });

    // Sort boosted escorts by tier
    const boosted = escorts
      .filter(e => e.isBoosted)
      .sort((a, b) => orderRank[getPureTier(b.boostType)] - orderRank[getPureTier(a.boostType)]);

    // Shuffle normal escorts
    const normal = escorts.filter(e => !e.isBoosted);
    for (let i = normal.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [normal[i], normal[j]] = [normal[j], normal[i]];
    }

    const finalList = [...boosted, ...normal];

    // Group escorts by agency
    const agencies = {};
    finalList.forEach(e => {
      const name = e.agencyName.trim();
      if (!agencies[name]) {
        agencies[name] = {
          name,
          contactEmail: e.agencyEmail || 'N/A',
          contactPhone: e.agencyPhone || 'N/A',
          website: e.agencyWebsite || 'N/A',
          escorts: []
        };
      }
      agencies[name].escorts.push({
        name: e.name,
        profileUrl: `/author/${encodeURIComponent(e.name)}`,
        userImg: e.userImg || '/default-preview.jpg',
        city: e.city || 'N/A',
        areaLabel: e.areaLabel || 'N/A',
        age: e.age,
        isBoosted: e.isBoosted,
        boostType: e.boostType
      });
    });
     return res.render('index', {
        escorts: Object.values(agencies),
        loggedInEscort: escort || null,
        message: 'Verified Escorts found.',
        meta: {
        title: `Explore verified escort and call agencies | Streak.com`,
        description: `Browse hot and verified profiles from top agencies for best massages, companionship, and more.`,
        image: finalList[0]?.userImg || '/default-preview.jpg',
        url: req.protocol + '://' + req.get('host') + req.originalUrl
      }
      });
  } catch (err) {
    console.error('Agencies error:', err);
    res.status(500).json({ message: 'Server error fetching agencies.' });
  }
});

app.get('/city/:name', async (req, res) => {
  const rawCity = req.params.name;
  const rawGender = req.query.gender;
  const rawAgeRange = req.query.age;

  const city = typeof rawCity === 'string' ? rawCity.trim().toLowerCase() : '';
  const gender = typeof rawGender === 'string' ? rawGender.trim().toLowerCase() : '';
  const ageRange = typeof rawAgeRange === 'string' ? rawAgeRange.trim() : '';

  const meta = generateMeta(null, city || 'unknown', req); // Prevent slugify crash

  let minAge = null;
  let maxAge = null;

  if (ageRange.includes('-')) {
    const parts = ageRange.split('-');
    if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      [minAge, maxAge] = parts.map(Number);
    }
  } else if (ageRange === '51+') {
    minAge = 51;
  }

  console.log('Filter Params:', { city, gender, ageRange });

  if (!city || !gender) {
    return res.status(400).render('index', {
      escorts: [],
      message: 'Missing filter.',
      city,
      meta
    });
  }

  try {
    const escortEmail = req.session?.escort?.email;
    const escort = escortEmail ? await Escort.findOne({ email: escortEmail }) : null;

    let escorts = await Escort.find({
      allowedtopost: true,
      city: { $regex: new RegExp(city, 'i') },
      gender: { $regex: new RegExp(`^${gender}$`, 'i') }
    }).lean();

    const boosts = await BoostRequest.find({
      status: 'confirmed',
      expiresAt: { $gt: new Date() }
    }).select('escort boostType').lean();

    const boostMap = boosts.reduce((map, b) => {
      map[b.escort.toString()] = b.boostType;
      return map;
    }, {});

    escorts = escorts
      .filter(e => e.about && e.userImg && e.name && e.areaLabel)
      .map(e => {
        let age = null;
        if (e.dob && !isNaN(new Date(e.dob))) {
          const bd = new Date(e.dob);
          const today = new Date();
          age = today.getFullYear() - bd.getFullYear();
          const m = today.getMonth() - bd.getMonth();
          if (m < 0 || (m === 0 && today.getDate() < bd.getDate())) age--;
        }
        return {
          ...e,
          age,
          isBoosted: Boolean(boostMap[e._id.toString()]),
          boostType: boostMap[e._id.toString()] || null
        };
      });

    if (minAge !== null || maxAge !== null) {
      escorts = escorts.filter(e => {
        if (e.age === null) return false;
        if (minAge !== null && e.age < minAge) return false;
        if (maxAge !== null && e.age > maxAge) return false;
        return true;
      });
    }

    const boosted = escorts
      .filter(e => e.isBoosted)
      .sort((a, b) => orderRank[getPureTier(b.boostType)] - orderRank[getPureTier(a.boostType)]);

    const normal = escorts.filter(e => !e.isBoosted);
    for (let i = normal.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [normal[i], normal[j]] = [normal[j], normal[i]];
    }

    const finalList = [...boosted, ...normal];

    if (!finalList.length) {
      return res.render('index', {
        escorts: [],
        loggedInEscort: escort || null,
        message: 'No verified profiles match that filter.',
        city,
        meta
      });
    }

    res.render('index', {
      escorts: finalList,
      loggedInEscort: escort || null,
      city,
      gender,
      message: null,
      meta
    });

  } catch (err) {
    console.error('Error in /city/:name route:', err.stack);
    res.status(500).render('index', {
      escorts: [],
      message: 'Server error while filtering.'
    });
  }
});

app.get('/register', (req, res)=> {
    res.sendFile(path.join(__dirname, 'register.html'));
})

app.post('/register', async (req, res) => {
  let escort = req.body;
  
  try {
    const escortExists = await Escort.findOne({ email: escort.email.trim().toLowerCase() });

    if (escortExists) {
      return res.status(400).json({ success: false, message: 'This email already exists' });
    }

    let hashedPassword = await bcrypt.hash(req.body.password, 10);
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = Date.now() + 3600000; // 1 hour
    escort = { ...escort, password: hashedPassword, isVerified: false, verificationToken, verificationExpires};//default for email verification
    await new Escort(escort).save();
    console.log(escort)
      // Send verification email
    const transporter = nodemailer.createTransport({
      service: 'gmail',
     auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
    });

    const expiryDate = new Date(verificationExpires).toLocaleString('en-KE', {
  weekday: 'short',
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'Africa/Nairobi'
});

const mailOptions = {
  from: process.env.EMAIL_USER,
  to: escort.email,
  subject: 'Email Verification',
  html: `
    <p>Hi ${escort.name}, Please verify your email by clicking the link below.</p>
    <a href="https://streak-1.onrender.com/verify/${verificationToken}">Verify Email</a>
    <p>This link will expire on <strong>${expiryDate}</strong>.</p>
    <p>If it expires, you can request a new one from the login page.</p>
  `
};

    await transporter.sendMail(mailOptions);

    res.status(201).json({ success: true, message: 'Check your email for verification link' });  
    } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Error registering user' });
  }
});

app.post('/register-agency', async (req, res) => {
  let agency = req.body;

  try {
    const email = agency.agencyEmail.trim().toLowerCase();

    // Check if email already exists
    const existingEscort = await Escort.findOne({ email });
    if (existingEscort) {
      return res.status(400).json({ success: false, message: 'This email already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(agency.password, 10);

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = Date.now() + 3600000; // 1 hour

    // Create escort document with role: 'agency'
    const escort = {
      name: agency.agencyName,
      email,
      password: hashedPassword,
      role: 'agency',
      agencyName: agency.agencyName,
      agencyEmail: email,
      phone: agency.phone,
      city: agency.city,
      areaLabel: agency.areaLabel,
      description: agency.description,
      isVerified: false,
      verificationToken,
      verificationExpires
    };

    await new Escort(escort).save();
    console.log('Agency registered:', escort);

    // Send verification email
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    const expiryDate = new Date(verificationExpires).toLocaleString('en-KE', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Africa/Nairobi'
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Email Verification',
      html: `
        <p>Hi ${agency.agencyName}, Please verify your agency email by clicking the link below.</p>
        <button style=" margin: 0.5rem;
      background: #28a745;
      padding: 0.7rem 1.5rem;
      font-size: 1rem;
      border: none;
      border-radius: 5px;
      cursor: pointer;"><a style="text-decoration: none; color: black;" href="https://streak-1.onrender.com/verify/${verificationToken}">Verify Email</a></button>
        <p>This link will expire on <strong>${expiryDate}</strong>.</p>
        <p>If it expires, you can request a new one from the login page.</p>
      `
    };

    await transporter.sendMail(mailOptions);

    res.status(201).json({ success: true, message: 'Check your email for verification link' });

  } catch (err) {
    console.error('Error registering agency:', err);
    res.status(500).json({ success: false, message: 'Error registering agency' });
  }
});

app.get('/verify/:token', async (req, res) => {
  const { token } = req.params;

  const escort = await Escort.findOne({
    verificationToken: token,
    verificationExpires: { $gt: Date.now() }
  });

  if (!escort) {
    return res.status(400).send('Invalid or expired token');
  }

  escort.isVerified = true;
  escort.verificationToken = undefined;
  escort.verificationExpires = undefined;
  console.log(`Verified account: ${escort.email} (${escort.role})`);

  await escort.save();

  res.redirect('/login');
});

app.post('/admin/create-user', async (req, res) => {
  try {
    // Optional: verify admin session or token
    if (req.session?.escort?.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const {
      name,
      email,
      password,
      phone,
      dob,
      gender,
      orientation,
      weight,
      city,
      areaLabel,
      location,
      services,
      userImg
    } = req.body;

    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await Escort.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new Escort({
      name,
      email: normalizedEmail,
      password: hashedPassword,
      phone,
      dob,
      gender,
      orientation,
      weight,
      city,
      areaLabel,
      location,
      services,
      userImg,
      role: 'escort',
      isVerified: false,
      allowedtopost: true,
      createdBy: req.user._id // optional audit trail
    });

    await newUser.save();
    console.log(`Admin created user: ${email}`);

    res.status(201).json({ success: true, message: 'User created successfully', user: newUser });
  } catch (err) {
    console.error('Admin user creation error:', err);
    res.status(500).json({ success: false, message: 'Failed to create user' });
  }
});

app.get('/login', (req, res)=> {
    if(req.session.isLoggedIn) {
        return res.redirect('/');
    }
    res.sendFile(path.join(__dirname, 'login.html'));   
});

app.post('/login', loginLimiter, async (req, res) => {
  const { input, password } = req.body;
try {
  const escort = await Escort.findOne({  $or: [
    { email: input.trim().toLowerCase() },
    { name: input.trim().toLowerCase() } // make sure 'username' exists on the Escort model
  ]}).lean();
  if (!escort) return res.status(404).json({ success: false, message: 'Account not found' });
  if (!escort.isVerified) {
  return res.status(403).json({ success: false, message: 'Please verify your email first.' });
}

  const match = await bcrypt.compare(password, escort.password);
  if (!match) return res.status(401).json({ success: false, message: 'Invalid Email or Password.' });

  req.session.escort = {
    name: escort.name,
    id: escort._id,
    email: escort.email,
    role: escort.role || 'user'
  };
  req.session.isLoggedIn = true;

  req.session.save(err => {
    if (err) {
      console.error('Session error:', err);
      return res.status(500).json({ success: false, message: 'Server error' });
    }
    res.json({ success: true, message: 'Login successful' });
  });
} catch (err) {
  console.error('Login error:', err);
  res.status(500).json({ success: false, message: 'Server error' });
}

});

app.get('/forgot-password', (req, res)=>{
  res.sendFile(path.join(__dirname, 'forgotPassword.html'));
})

app.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  const user = await Escort.findOne({ email });
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });

  const token = crypto.randomBytes(32).toString('hex');
  user.resetToken = token;
  user.resetTokenExpiry = Date.now() + 3600000;
  await user.save();

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Your Password Reset Link',
    html: `
      <p>Hi, Click the link below to reset your password.</p>
      <button style=" margin: 0.5rem;
      background: #28a745;
      padding: 0.7rem 1.5rem;
      font-size: 1rem;
      border: none;
      border-radius: 5px;
      cursor: pointer;"><a style="text-decoration: none; color: black;"href="https://streak-1.onrender.com/reset-password?token=${token}">Reset Password</a></button>
      <p>If you didn't request this, please ignore.</p>
    `
  };

  transporter.sendMail(mailOptions, (err, info) => {
    if (err) {
      console.error('Email error:', err);
      return res.status(500).json({ success: false, message: 'Email error' });
    }
    res.json({ success: true, message: 'Password reset link sent successfully. Check email' });
  });
});

app.get('/reset-password', (req, res)=>{
  res.sendFile(path.join(__dirname, 'resetPassword.html'));
})

app.post('/reset-password', loginLimiter, async (req, res) => {
  const { email, token, newPassword } = req.body;
  try {
    const user = await Escort.findOne({ email });

  if (!user || user.resetToken !== token || user.resetTokenExpiry < Date.now()) {
    return res.status(400).send('Invalid or expired token');
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  user.password = hashedPassword;
  user.resetToken = undefined;
  user.resetTokenExpiry = undefined;
  await user.save();

  res.json({success: true, message: 'Password reset successfully'});
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ success: false, message: 'Password reset error try again later.'})
  }
});

app.post('/resend-reset-link', async (req, res) => {
  const { email } = req.body;

  try {
    const user = await Escort.findOne({ email });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (user.resetTokenExpiry && user.resetTokenExpiry > Date.now()) {
      const minutesLeft = Math.ceil((user.resetTokenExpiry - Date.now()) / 60000);
      return res.status(429).json({
        success: false,
        message: `Reset link already sent. Please wait ${minutesLeft} minute(s) before requesting again.`
      });
    }

    // Generate new token
    const token = crypto.randomBytes(32).toString('hex');
    user.resetToken = token;
    user.resetTokenExpiry = Date.now() + 1000 * 60 * 15; // 15 minutes
    await user.save();

    
    // TODO: Replace with actual email/SMS sending logic
    const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Your Password Reset',
    html: `
      <p>Hi, Click the link below to reset your password.</p>
      <a href="http://192.168.0.101:3000/reset-password?token=${token}">Reset Password</a>
      <p>If you didn't request this, please ignore.</p>
    `
  };

  const info = await transporter.sendMail(mailOptions);
  console.log('Email sent:', info.response);
  res.json({ success: true, message: 'Reset link sent successfully. Check your email.' });


  } catch (err) {
    console.error('Resend link error:', err);
    res.status(500).json({ success: false, message: 'Error sending reset link' });
  }
});

app.get("/logout", (req, res) => {
  if (!req.session.isLoggedIn) return res.redirect("/login");

  req.session.destroy(err => {
    if (err) {
      console.error("Logout error:", err);
      return res.redirect("/profile");
    }
    res.clearCookie("connect.sid"); 
    res.redirect("/login");
  });
});

app.post('/post/:id', async (req, res) => {
  const escortId = req.params.id;
  const { allowedtopost } = req.body;

  try {
    const updatedEscort = await Escort.findByIdAndUpdate(escortId, {
      allowedtopost,
      publishedAt: allowedtopost ? new Date() : null
    }).lean();

    if (!updatedEscort) {
      return res.status(404).json({ success: false, message: 'Escort not found' });
    }
    req.session.escort = updatedEscort;
    console.log(req.session.escort.allowedtopost, 'allowed to post')


    return res.json({ success: true, message: `Escort ${allowedtopost ? 'published' : 'unpublished'} successfully` });



  } catch (err) {
    console.error('Error updating publish status:', err);
    return res.status(500).json({ success: false, message: 'Check your internet and try again.' });
  }
});
app.get('/profile', async (req, res) => {
  if (!req.session.isLoggedIn && !req.session.escort?.email) {
    return res.redirect('/login');
  }

  const email = req.session.escort.email;
  const escort = await Escort.findOne({ email });
  if (!escort) {
    return res.status(404).send('Escort not found');
  }

  const viewerId = req.user ? req.user._id : escort._id; 
  const isSelfViewing = viewerId.toString() === escort._id.toString();

  const viewCount = await ProfileView.countDocuments({ profile: escort._id });

  if (!isSelfViewing) {
    await ProfileView.create({ profile: escort._id, viewer: viewerId });
  }

  escort.totalViews = viewCount;

  const missingFields = getMissingFields(escort);
  console.log(escort);
  res.render('escort', {
    loggedInEscort: escort,
    missingFields: missingFields
  });
});



app.get('/agency-dashboard', (req, res) => {
  if (!req.session.escort || req.session.escort.role !== 'agency') {
    return res.status(403).json({ success: false, message: 'Unauthorized' });
  }
  
  res.render('agencyDashboard', { meta: metData(req)})
})

app.get('/api/agency/escorts', async (req, res) => {
  try {
    const agencyEmail = req.session.user.email; // Assuming user is authenticated
    const escorts = await Escort.find({ role: 'escort', agencyEmail: agencyEmail });
    if (!escorts || escorts.length === 0) {
      return res.status(404).json({ success: false, message: 'No escorts found for this agency', data: [] });
    }
    res.json({
      success: true,
      count: escorts.length,
      escorts
    });

  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch escorts' });
  }
});

app.delete('/api/agency/escort/:id', async (req, res) => {
  try {
    const escort = await Escort.findById(req.params.id);
    if (!escort || escort.role !== 'escort') {
      return res.status(404).json({ success: false, message: 'Escort not found' });
    }

    if (escort.agencyEmail !== req.session.user.email) {
      return res.status(403).json({ success: false, message: 'You are not authorized to delete this escort' });
    }

    await Escort.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Escort deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error deleting escort' });
  }
});

app.post('/api/agency/add-escort', async (req, res) => {
  if (!req.session.isLoggedIn){
    return res.status(401).json( { success: false, message: 'Unauthorized' });
  }
  const { name, gender, weight, dob, orientation, email } = req.body;

  if (!name || !gender || !weight || !dob || !orientation || !email) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }

  try {
    const password = req.body.password || crypto.randomBytes(8).toString('hex');
    const normalizedEmail = req.body.email.trim().toLowerCase(); // Escort's email
    const agencyEmail = req.session.user.email.trim().toLowerCase(); // Agency's email
    const escortExists = await Escort.findOne({ email: normalizedEmail });

    if (escortExists) {
      return res.status(400).json({ success: false, message: 'Escort email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const escort = new Escort({
      name,
      gender,
      weight,
      dob,
      orientation,
      email: normalizedEmail,
      agencyEmail: agencyEmail,
      password: hashedPassword,
      role: 'escort',
      allowedtopost: true,
      isVerified: false
    });

    await escort.save();
    res.status(201).json({ success: true, message: 'Escort added successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error adding escort' });
  }
});


app.post('/profile/edit', async (req, res) => {
  if (!req.session.isLoggedIn || !req.session.escort?.email) {
    return res.redirect('/login');
  }

  const updatedData = req.body;
  console.log(updatedData);

  try {
    let escort = await Escort.findOne({ email: req.session.escort.email }).lean();

    if (!escort) {
      return res.status(404).json({ error: 'Escort not found' });
    }

    if (Array.isArray(updatedData.gallery)) {
      escort.gallery = escort.gallery || [];
      escort.gallery.push(...updatedData.gallery);
      delete updatedData.gallery;
    }

    escort = {...escort, ...updatedData};

    escort.age = Number(updatedData.age || escort.age);
    escort.weight = Number(updatedData.weight || escort.weight);
    escort.userImg = updatedData.userImg || escort.userImg;

    await Escort.updateOne(
    { email: req.session.escort.email },              
    { $set: escort } 
  );
  

    // 6️⃣ Refresh session data
    req.session.escort = escort;

    // Optional: calculate missing fields
    const missingFields = getMissingFields(escort); // your custom function

    console.log(`Escort profile updated: ${escort}`);
    return res.json({ loggedInEscort: escort, missingFields, success: true });

  } catch (err) {
    console.error('Profile update error:', err);
    return res.status(500).json({ error: 'Server error during profile update' });
  }
});

app.get('/escorts-map', (req, res)=> {
  res.render('map')   
})

// API endpoint
app.get('/api/escorts', async (req, res) => {
  const { city, lat, lng } = req.query;

  let results = [];

  if (city) {
    results = await Escort.find({ city: new RegExp(`^${city}$`, 'i') }).lean();
  } else if (lat && lng) {
    const userLat = parseFloat(lat);
    const userLng = parseFloat(lng);

    results = await Escort.find({
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [userLng, userLat]
          },
          $maxDistance: 10000 // 10km in meters
        }
      }
    }).lean();
  } else {
    results = await Escort.find({}).lean();
  }
  results = results.map(e => ({
  name: e.name,
  lat: e.location.coordinates[1],
  lng: e.location.coordinates[0],
  tier: e.isPremium ? 'gold' : e.isVerified ? 'bronze' : 'standard'
}));

  res.json(results);
});
//  GET 
//  Renders homepage with boosted escorts first, then random others.
app.get('/', async (req, res) => {
  let escort;
    const meta = {
    title: "Kenya Escorts | Verified Companions in Nairobi, Kiambu & Beyond",
    description: "Discover verified escorts across Kenya. Private meetups, luxury companionship, and discreet call girls in Nairobi, Kiambu, Mombasa and more.",
    image: "https://raha.com/default-preview.jpg",
    url: `${req.protocol}://${req.get('host')}${req.originalUrl}`
  };

  try {
    if (req.session.escort) {
      escort = await Escort.findOne({ email: req.session.escort.email });
      if (escort && escort.dob) {
        const birthDate = new Date(escort.dob);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }
        escort.age = age;
      }
    } else {
      escort = null;
    }

    // Check cache
    let verified = homeCache.get('home_escorts');
    if (!verified) {
      // Fetch verified escorts
      const escorts = await Escort.find({ allowedtopost: true })
        .select('name userImg phone city areaLabel gender dob about')
        .lean();

      // Active boosts
      const activeBoosts = await BoostRequest.find({
        status: 'confirmed',
        expiresAt: { $gt: new Date() }
      }).select('escort boostType').lean();

      // Boost map
      const boostMap = activeBoosts.reduce((m, b) => {
        m[b.escort.toString()] = b.boostType;
        return m;
      }, {});

      // Annotate escorts
      verified = escorts
        .filter(e => e.name && e.about && e.userImg && e.areaLabel)
        .map(e => {
          let age = null;
          if (e.dob) {
            const birthDate = new Date(e.dob);
            const today = new Date();
            age = today.getFullYear() - birthDate.getFullYear();
            const monthDiff = today.getMonth() - birthDate.getMonth();
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
              age--;
            }
          }
          return {
            ...e,
            age,
            isBoosted: Boolean(boostMap[e._id.toString()]),
            boostType: boostMap[e._id.toString()] || null
          };
        });

      // Prioritize boosted by tier only
      const boosted = verified
        .filter(e => e.isBoosted)
        .sort((a, b) =>
          orderRank[getPureTier(b.boostType)] - orderRank[getPureTier(a.boostType)]
        );

      // Shuffle non-boosted
      const normal = verified.filter(e => !e.isBoosted);
      for (let i = normal.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [normal[i], normal[j]] = [normal[j], normal[i]];
      }

      verified = [...boosted, ...normal];
      homeCache.set('home_escorts', verified);
    }

    // Render homepage
    res.render('index', {
      loggedInEscort: escort || null,
      escorts: verified,
      city: 'Nairobi',
      meta
    });

  } catch (err) {
    console.error('Error in home route:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/swipe-feed/:city', async (req, res) => {
  const city = req.params.city || 'Nairobi';
  const gender = req.query.gender || 'Female';
  const seenIds = req.query.seen?.split(',') || [];

  const escorts = await Escort.find({
    allowedtopost: true,
    city: { $regex: new RegExp(`^${city}$`, 'i') },
    gender: { $regex: new RegExp(`^${gender}$`, 'i') },
    _id: { $nin: seenIds }
  }).lean();

  res.render('swipe', {escorts: escorts});
});

const location = {
  Nairobi: [
    "Kilimani", "Westlands", "Karen", "CBD", "Roysambu", "Ngara", "Nairobi West", "Donholm", "Dandora", "Ojijo", "Yaya", "Sarit",
    "Ruaka", "Syokimau", "Kitengela", "Embakasi", "South B", "South C", "Lavington", "Parklands"
  ],
  Kiambu: [
    "Juja", "Kikuyu", "Ruiru", "Githurai", "Thika", "Limuru", "Kabete", "Tigoni"
  ]
};

function generateMeta(area = null, city = "Nairobi", req) {
  const safeArea = typeof area === 'string' && area.trim() !== '' ? area : city;
  console.log('Slug input:', area);
  const areaSlug = slugify(safeArea, { lower: true });
  const baseUrl = `${req.protocol}://${req.get('host')}`;

  return {
    title: `Verified Escorts in ${safeArea}, ${city} | Discreet Companions & Private Meetups`,
    description: `Explore verified escorts and discreet call girls in ${safeArea}, ${city}. Offering luxury companionship, massages, and private meetups near you.`,
    image: `${baseUrl}/images/previews/${areaSlug}.jpg`,
    url: `${baseUrl}/escorts-from-${areaSlug}`
  };
}

app.get('/robots.txt', (req, res) => {
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  res.type('text/plain');
  res.send(`User-agent: *
Disallow: /admin
Disallow: /profile
Disallow: /login
Allow: /

Sitemap: ${baseUrl}/sitemap.xml`);
});

app.get('/sitemap.xml', async (req, res) => {
  try {
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const cities = await Escort.distinct('city'); // Unique cities
    const genders = await Escort.distinct('gender'); // Unique genders

    // Homepage entry
    const homepageEntry = `
      <url>
        <loc>${baseUrl}/</loc>
        <lastmod>${new Date().toISOString()}</lastmod>
        <changefreq>daily</changefreq>
        <priority>1.0</priority>
      </url>`;

    const cityEntries = cities.flatMap(city => {
      return genders.map(gender => `
        <url>
          <loc>${baseUrl}/city/${encodeURIComponent(city)}?gender=${encodeURIComponent(gender)}</loc>
          <lastmod>${new Date().toISOString()}</lastmod>
          <changefreq>weekly</changefreq>
          <priority>0.7</priority>
        </url>`);
    }).join('');

  const areas = {
    Nairobi: [
      "Kilimani", "Westlands", "Karen", "CBD", "Roysambu", "Ngara", "Donholm", "Nairobi West", "Dandora", "Ojijo", "Yaya", "Sarit",
      "Ruaka", "Syokimau", "Kitengela", "Embakasi", "South B", "South C", "Lavington", "Parklands"
    ],
    Kiambu: [
      "Juja", "Kikuyu", "Ruiru", "Githurai",
      "Thika", "Limuru", "Kabete", "Tigoni"
    ]}
  

    const areasList = Object.values(areas).flat(); // Flatten all area arrays

const areaEntries = areasList.map(area => {
  const slug = slugify(area, { lower: true });
  return `
    <url>
      <loc>${baseUrl}/escorts-from-${slug}</loc>
      <lastmod>${new Date().toISOString()}</lastmod>
      <changefreq>weekly</changefreq>
      <priority>0.7</priority>
    </url>
  `;
}).join('');


const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${homepageEntry.trim()}
  ${cityEntries.trim()}
  ${areaEntries.trim()}
</urlset>`;


    res.type('application/xml');
    res.send(xml);
  } catch (err) {
    console.error('Sitemap generation error:', err);
    res.status(500).send('Internal Server Error');
  }
});

app.use((req, res) => {
  res.status(404).render('404');
})