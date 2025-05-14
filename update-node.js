module.exports = function (RED) {
  const handle_error = function (err, node) {
    node.log(err.body || err.message);
    node.status({ fill: "red", shape: "dot", text: err.message });
    node.error(err.message);
  };

  function OdooXMLRPCUpdateNode(config) {
    RED.nodes.createNode(this, config);
    this.host = RED.nodes.getNode(config.host);
    const node = this;

    node.on('input', async function (msg) {
      node.status({});

      try {
        const odoo_inst = await node.host.connect();

        let inParams;
        if (msg.payload) {
          if (!Array.isArray(msg.payload)) {
            throw new Error('When defined, msg.payload must be an array: [ids, {field: value}]');
          }
          inParams = msg.payload;
        } else {
          throw new Error('msg.payload is required and must be an array: [ids, {field: value}]');
        }

        const model = config.model;
        const args = [inParams];

        node.log(`Updating record(s) in model "${model}" with args: ${JSON.stringify(args)}`);

        const result = await odoo_inst.execute_kw(model, 'write', args);

        msg.payload = result;
        node.status({ fill: "green", shape: "dot", text: "Record updated" });
        node.send(msg);

      } catch (err) {
        handle_error(err, node);
      }
    });
  }

  RED.nodes.registerType("odoo-xmlrpc-update", OdooXMLRPCUpdateNode);
};
