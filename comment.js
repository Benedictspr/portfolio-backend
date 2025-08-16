const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');

const commentsFilePath = path.join(__dirname, '../data/comments.json');

// Load existing comments from file
function loadComments() {
    if (!fs.existsSync(commentsFilePath)) {
        fs.writeFileSync(commentsFilePath, JSON.stringify({}), 'utf8');
    }
    return JSON.parse(fs.readFileSync(commentsFilePath, 'utf8'));
}

// Save comments to file
function saveComments(data) {
    fs.writeFileSync(commentsFilePath, JSON.stringify(data, null, 2), 'utf8');
}

// Email transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

module.exports = function (app) {
    // ==========================
    // Get comments for a page
    // ==========================
    app.get('/api/comments/:pageId', (req, res) => {
        const data = loadComments();
        const pageId = req.params.pageId;

        if (!data[pageId]) {
            data[pageId] = { edits: {}, comments: [] };
            saveComments(data);
        }

        res.json(data[pageId].comments || []);
    });

    // ==========================
    // Post a new comment
    // ==========================
    app.post('/api/comments/:pageId', async (req, res) => {
        const data = loadComments();
        const pageId = req.params.pageId;

        if (!data[pageId]) {
            data[pageId] = { edits: {}, comments: [] };
        }

        const newComment = {
            id: Date.now(),
            name: req.body.author || 'Anonymous',
            message: req.body.text,
            timestamp: new Date().toISOString()
        };

        data[pageId].comments.push(newComment);
        saveComments(data);

        try {
            await transporter.sendMail({
                from: `"Portfolio Comments" <${process.env.EMAIL_USER}>`,
                to: process.env.NOTIFY_EMAIL,
                subject: `New comment on page: ${pageId}`,
                text: `Author: ${newComment.name}\n\nComment:\n${newComment.message}\n\nPosted at: ${newComment.timestamp}`
            });
            console.log("Email sent for new comment");
        } catch (err) {
            console.error("Error sending email:", err);
        }

        res.json({ success: true, comment: newComment });
    });

    // ==========================
    // Update comment (Admin)
    // ==========================
    app.put('/api/comments/:pageId/:commentId', (req, res) => {
        const data = loadComments();
        const { pageId, commentId } = req.params;

        if (!data[pageId] || !data[pageId].comments) {
            return res.status(404).json({ success: false, message: "Page or comments not found" });
        }

        const comment = data[pageId].comments.find(c => c.id == commentId);
        if (!comment) {
            return res.status(404).json({ success: false, message: "Comment not found" });
        }

        comment.message = req.body.text || comment.message;
        saveComments(data);

        res.json({ success: true, comment });
    });

    // ==========================
    // Delete comment (Admin)
    // ==========================
    app.delete('/api/comments/:pageId/:commentId', (req, res) => {
        const data = loadComments();
        const { pageId, commentId } = req.params;

        if (!data[pageId] || !data[pageId].comments) {
            return res.status(404).json({ success: false, message: "Page or comments not found" });
        }

        const index = data[pageId].comments.findIndex(c => c.id == commentId);
        if (index === -1) {
            return res.status(404).json({ success: false, message: "Comment not found" });
        }

        data[pageId].comments.splice(index, 1);
        saveComments(data);

        res.json({ success: true });
    });

    // ==========================
    // Admin edit page content
    // ==========================
    app.post('/api/admin/edit/:pageId', (req, res) => {
        const data = loadComments();
        const pageId = req.params.pageId;

        if (!data[pageId]) {
            data[pageId] = { edits: {}, comments: [] };
        }

        data[pageId].edits = {
            content: req.body.content,
            timestamp: new Date().toISOString()
        };

        saveComments(data);

        res.json({ success: true, content: data[pageId].edits });
    });

    // ==========================
    // Get admin edits for a page
    // ==========================
    app.get('/api/admin/edit/:pageId', (req, res) => {
        const data = loadComments();
        const pageId = req.params.pageId;

        if (!data[pageId]) {
            data[pageId] = { edits: {}, comments: [] };
            saveComments(data);
        }

        res.json(data[pageId].edits || {});
    });
};
