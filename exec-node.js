function isDefinedValue(v) {
  return !(v == null || typeof v === 'undefined');
}

module.exports = function (RED) {
  function OdooXMLRPCExecNode(config) {
    RED.nodes.createNode(this, config);
    this.host = RED.nodes.getNode(config.host);
    const node = this;

    node.on('input', async function (msg, send, done) {
      node.status({});
      send = send || function () { node.send.apply(node, arguments); };

      try {
        const odoo_inst = await node.host.connect(); // host.connect must return a Promise

        const method = msg.method || config.method;
        const model = config.model;

        const args = msg.payload;
        if (!Array.isArray(args)) {
          throw new Error("msg.payload must be an array (even if only one argument)");
        }

        const kwargs = msg.kwargs || {};

        node.log(`Calling ${model}.${method} with args: ${JSON.stringify(args)} and kwargs: ${JSON.stringify(kwargs)}`);

        const value = await odoo_inst.execute_kw(model, method, args, kwargs);

        msg.payload = value;

        if (value === true) {
          node.status({ fill: "green", shape: "dot", text: `'${method}' executed` });
        }

        send(msg);
        if (done) done();
      } catch (err) {
        node.log(err.body || err.message);
        node.status({ fill: "red", shape: "dot", text: err.message });
        if (done) {
          done(err);
        } else {
          node.error(err, err.message);
        }
      }
    });
  }

  RED.nodes.registerType("odoo-xmlrpc-exec", OdooXMLRPCExecNode);
};
