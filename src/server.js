const express = require("express");
const router = express.Router();
const axios = require("axios");
const cheerio = require("cheerio");
const baseUrl = "http://eriksguestbook.servehttp.com:9574";
const viewEndpoint = "/cgi-bin/view-guest-book.cgi";
const signEndpoint = "/cgi-bin/sign-guest-book.cgi"; 
const app = express();

async function postCgi(name, email, comment) {
    // 1. Use URLSearchParams to structure the form data safely
    const params = new URLSearchParams();
    params.append('name', name);
    params.append('email', email);
    params.append('comment', comment);
    params.append('answer', '20'); // Hardcoded math challenge bypass

    try {
        // 2. Point axios to the endpoint, passing params as the body
        const response = await axios.post(`${baseUrl}${signEndpoint}`, params, {
            headers: {
                // 3. Change this header to form-urlencoded so the CGI app understands it
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        const html = response.data;
        const $ = cheerio.load(html);

        // This grabs the status message (Thank you / Wrong Answer)
        const resultText = $('body h2').last().text().trim();

        console.log("Result Message from target server:", resultText);

        if (resultText.includes("Wrong answer")) {
            console.log("❌ Form submission failed!");
        } else if (resultText.includes("Thank you")) {
            console.log("✅ Form submission succeeded!");
        }
        
        return resultText;
    } catch (err) {
        console.error('Network or Server Error:', err.message);
        throw err; // Throw it so your router's catch block can catch it if needed!
    }
}


async function getCgi() {
    const response = await axios.get(`${baseUrl}${viewEndpoint}`);
    const html = response.data;
    const entries = [];

    //Load the HTML into a DOM-like parser
    const $ = cheerio.load(html);

    // Loop through each table because one table = one guestbook entry
    $("table").each(function (index, element) {
        const rows = $(element).find("tr");

        // Ensure the table has exactly 4 rows (Name, Email, Date, Comment)
        if (rows.length >= 4) {
            const entry = {
                // rows.eq(0) gets the first row (Name), .find("td").eq(1) gets the second column value
                name: $(rows.eq(0)).find("td").eq(1).text().trim(),
                email: $(rows.eq(1)).find("td").eq(1).text().trim(),
                date: $(rows.eq(2)).find("td").eq(1).text().trim(),
                comment: $(rows.eq(3)).find("td").eq(1).text().trim()
            };
            
            entries.push(entry);
        }
    });

    console.log(entries);
    return entries;

}

router.get('/cgi', async(req, res) => {
    try {
        const entries = await getCgi();
        // FIX 3: Pass the raw array directly to get proper JSON output
        return res.status(200).json({entries}); 
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Failed to fetch or parse guestbook data" });
    }
});

router.post('/cgi', async(req, res) => {
    const {
        name,
        email,
        comment
    } = req.body;

    if(!name || !email || !comment)
    {
        return res.status(400).json({ error: "Missing required fields"});
    }
    try {
        const response = await postCgi(name, email, comment);
        return res.json({ success: true, message:response });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to make entry guestbook data" });
    }
});

const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(router);

app.listen(PORT, () => {
    console.log(`Server is running on ${PORT} port`);
});


