module.exports = function (RED) {
    const handle_error = function (err, node) {
        node.log(err.body || err.message);
        node.status({ fill: "red", shape: "dot", text: err.message });
        node.error(err.message);
    };

    function OdooXMLRPCUnlinkNode(config) {
        RED.nodes.createNode(this, config);
        this.host = RED.nodes.getNode(config.host);
        const node = this;

        node.on('input', async function (msg) {
            node.status({});

            try {
                const odoo_inst = await node.host.connect();

                const ids = msg.payload;

                if (!Array.isArray(ids)) {
                    throw new Error("msg.payload must be an array of record IDs to delete");
                }

                node.log(`Deleting ${ids.length} record(s) from model "${config.model}"...`);

                const result = await odoo_inst.execute_kw(config.model, 'unlink', [[ids]]);

                msg.payload = result;
                node.status({ fill: "green", shape: "dot", text: "Records deleted" });
                node.send(msg);
            } catch (err) {
                handle_error(err, node);
            }
        });
    }

    RED.nodes.registerType("odoo-xmlrpc-unlink", OdooXMLRPCUnlinkNode);
};
