module.exports = function (RED) {
    function OdooXMLRPCConfigNode(n) {
        RED.nodes.createNode(this, n);
        this.url = n.url;
        this.db = n.db;
        this.username = n.username;
        this.password = n.password;

        this.connect = async function () {
            const Odoo = require('odoo-xmlrpc');
            const odoo_inst = new Odoo({
                url: this.url,
                db: this.db,
                username: this.username,
                password: this.password,
            });

            return new Promise((resolve, reject) => {
                odoo_inst.connect(function (err) {
                    if (err) {
                        return reject(err);
                    }
                    return resolve(odoo_inst);
                });
            });
        };
    }

    RED.nodes.registerType("odoo-xmlrpc-config", OdooXMLRPCConfigNode);
};
