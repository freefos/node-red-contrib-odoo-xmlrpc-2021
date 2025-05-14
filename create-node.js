module.exports = function (RED) {
    const handle_error = function (err, node) {
        node.log(err.body || err.message);
        node.status({ fill: "red", shape: "dot", text: err.message });
        node.error(err.message);
    };

    function OdooXMLRPCCreateNode(config) {
        RED.nodes.createNode(this, config);
        this.host = RED.nodes.getNode(config.host);
        const node = this;

        node.on('input', async function (msg) {
            node.status({});

            try {
                const odoo_inst = await node.host.connect();

                const model = config.model;
                const payload = msg.payload;

                if (typeof payload !== 'object' || Array.isArray(payload)) {
                    throw new Error("msg.payload must be an object representing record fields");
                }

                // `create` expects a single object or list of objects
                const args = [[payload]];

                node.log(`Creating record in model "${model}" with values: ${JSON.stringify(payload)}`);

                const result = await odoo_inst.execute_kw(model, 'create', args);

                msg.payload = result;
                node.status({ fill: "green", shape: "dot", text: "Record created" });
                node.send(msg);
            } catch (err) {
                handle_error(err, node);
            }
        });
    }

    RED.nodes.registerType("odoo-xmlrpc-create", OdooXMLRPCCreateNode);
};
