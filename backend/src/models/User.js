import db from "../lib/db.js";

const DEFAULT_PROFILE_PIC =
  "https://res.cloudinary.com/dzj8q4l6c/image/upload/v1700000000/default-profile-pic.jpg";

const toUserRecord = (row) => {
  if (!row) return null;

  return {
    ...row,
    _id: row.id,
    profilePic: row.profilePic || DEFAULT_PROFILE_PIC,
  };
};

class User {
  constructor({ fullName, email, password, profilePic = DEFAULT_PROFILE_PIC }) {
    this.fullName = fullName;
    this.email = email;
    this.password = password;
    this.profilePic = profilePic;
  }

  async save() {
    const result = db
      .prepare(
        "INSERT INTO users (fullName, email, password, profilePic) VALUES (?, ?, ?, ?)"
      )
      .run(this.fullName, this.email, this.password, this.profilePic);

    const savedUser = db
      .prepare("SELECT * FROM users WHERE id = ?")
      .get(result.lastInsertRowid);

    return Object.assign(this, toUserRecord(savedUser));
  }

  static findById(id) {
    return {
      async select(selection = "") {
        const user = db.prepare("SELECT * FROM users WHERE id = ?").get(id);
        const record = toUserRecord(user);

        if (!record) return null;
        if (selection.includes("-password")) {
          const { password, ...safeUser } = record;
          return safeUser;
        }

        return record;
      },
    };
  }

  static async findOne(query = {}) {
    if (query.email) {
      return toUserRecord(
        db.prepare("SELECT * FROM users WHERE email = ?").get(query.email)
      );
    }

    if (query.id || query._id) {
      return toUserRecord(
        db.prepare("SELECT * FROM users WHERE id = ?").get(query.id ?? query._id)
      );
    }

    return null;
  }

  static async findByIdAndUpdate(id, updates = {}, options = {}) {
    const existingUser = db.prepare("SELECT * FROM users WHERE id = ?").get(id);
    if (!existingUser) return null;

    const nextProfilePic = updates.profilePic ?? existingUser.profilePic;
    const nextFullName = updates.fullName ?? existingUser.fullName;
    const nextEmail = updates.email ?? existingUser.email;
    const nextPassword = updates.password ?? existingUser.password;

    db.prepare(
      `
        UPDATE users
        SET fullName = ?, email = ?, password = ?, profilePic = ?
        WHERE id = ?
      `
    ).run(nextFullName, nextEmail, nextPassword, nextProfilePic, id);

    const updatedUser = db.prepare("SELECT * FROM users WHERE id = ?").get(id);
    return options.new ? toUserRecord(updatedUser) : toUserRecord(existingUser);
  }
}

export default User;
