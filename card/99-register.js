// models load as separate modules (models/<key>.js) and register here
FabriconCard.models = {};
FabriconCard.registerModel = (key, methods) => { FabriconCard.models[key] = methods; };
FabriconCard.AMS = { W: AMS_W, D: AMS_D, BASE: AMS_BASE, R: AMS_R };
window.FabriconCard = FabriconCard;
if (!customElements.get("fabricon-card")) customElements.define("fabricon-card", FabriconCard);
window.customCards = window.customCards || [];
window.customCards.push({ type: "fabricon-card", name: "Fabricon printer", description: "Interactive live 3D model of a 3D printer (Fabricon dashboard)" });
