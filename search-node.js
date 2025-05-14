function isDefinedValue(v){
  return !(v == null || typeof v === 'undefined');
}

function isUInt(v){
  return typeof v === 'number' && Math.floor(v) === v && v >= 0;
}

module.exports = function (RED) {
    const handle_error = function(err, node) {
        node.log(err.body || err.message);
        node.status({fill: "red", shape: "dot", text: err.message});
        node.error(err.message);
    };

    function OdooXMLRPCSearchNode(config) {
        RED.nodes.createNode(this, config);
        this.host = RED.nodes.getNode(config.host);
        const node = this;

        node.on('input', async function (msg) {
            node.status({});

            try {
                const odoo_inst = await node.host.connect();

                const offset = msg.offset;
                if (isDefinedValue(offset) && !isUInt(offset)) {
                    throw new Error('When offset is provided, it must be a positive integer number');
                }

                const limit = msg.limit;
                if (isDefinedValue(limit) && !isUInt(limit)) {
                    throw new Error('When limit is provided, it must be a positive integer number');
                }

                let filters = [];
                if (msg.filters) {
                    if (!Array.isArray(msg.filters)) {
                        throw new Error('When filters is provided, it must be an array');
                    }
                    filters = msg.filters;
                } else {
                    filters.push([]);
                }

                const args = [filters];

                node.log(`Searching for model "${config.model}" with filters: ${JSON.stringify(filters)}`);

                let result = await odoo_inst.execute_kw(config.model, 'search', args);

                if (isDefinedValue(offset)) {
                    result = result.slice(offset);
                }
                if (isDefinedValue(limit)) {
                    result = result.slice(0, limit);
                }

                msg.payload = result;
                node.status({ fill: "green", shape: "dot", text: `Found ${result.length} record(s)` });
                node.send(msg);
            } catch (err) {
                handle_error(err, node);
            }
        });
    }

    RED.nodes.registerType("odoo-xmlrpc-search", OdooXMLRPCSearchNode);
};
