// Validates/normalises profile fields. Used by the own-profile route and the admin user editor.
function buildProfileUpdates(body) {
    const { username, name, email, bio, profileImage, location, socialLinks } = body;
    const updates = {};

    if (username !== undefined) {
        if (!/^[a-zA-Z0-9_.]{3,30}$/.test(String(username).trim())) {
            return { error: "Username must be 3-30 characters: letters, numbers, _ or ." };
        }
        updates.username = String(username).trim();
    }
    if (name !== undefined) {
        if (!String(name).trim()) return { error: "Name cannot be empty." };
        updates.name = String(name).trim().slice(0, 60);
    }
    if (email !== undefined) {
        if (!/^\S+@\S+\.\S+$/.test(String(email).trim())) return { error: "Please enter a valid email address." };
        updates.email = String(email).trim().toLowerCase();
    }
    if (bio !== undefined) updates.bio = String(bio).slice(0, 250);
    if (profileImage !== undefined) {
        const img = String(profileImage);
        if (img && !/^data:image\/(png|jpe?g|gif|webp);base64,/.test(img) && !/^https?:\/\//.test(img)) {
            return { error: "Profile image must be an uploaded picture or an http(s) link." };
        }
        updates.profileImage = img;
    }
    if (location !== undefined) updates.location = String(location).slice(0, 80);
    if (socialLinks !== undefined) {
        updates.socialLinks = {
            twitter: String(socialLinks?.twitter || "").slice(0, 60),
            github: String(socialLinks?.github || "").slice(0, 60),
            website: String(socialLinks?.website || "").slice(0, 200)
        };
    }
    return { updates };
}

module.exports = { buildProfileUpdates };
