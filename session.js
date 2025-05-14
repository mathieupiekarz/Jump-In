var sessions = require("express-session");
module.exports = {

    init: () => {
        return sessions({
            secret: "c0f8ad7f-2e49-4a1e-9d6c-fb75e3c8abf4~Z4!tR9@Kx#Wp2$Mq7J^Lv0Xe",
            saveUninitialized: true,
            cookie: { maxAge: 3600 * 1000 }, // 60 minutes
            resave: false,
        });
    },

    creatSession: function (session, mail, role) {
        session.userid = mail;
        session.role = role;
        session.save(function (err) {
            console.log(err);
        });
        return session;
    },

    isConnected: (session, role) => {
        if (!session.userid || session.userid === undefined) return false;
        if (role && session.role !== role) return false;
        return true;
    },

    deleteSession: function (session) {
        session.destroy();
    },
};
