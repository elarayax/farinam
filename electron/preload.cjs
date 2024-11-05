const { contextBridge, ipcRenderer } = require('electron');

// Exponemos métodos del proceso principal al contexto de la ventana
contextBridge.exposeInMainWorld('electron', {
    // Zonas
    readZonas: () => ipcRenderer.invoke('read-zonas'),
    addZona: (zona) => ipcRenderer.invoke('add-zona', zona),
    removeZona: (zonaIndex) => ipcRenderer.invoke('remove-zona', zonaIndex),
    saveZonas: (zonas) => ipcRenderer.invoke('save-zonas', zonas),

    // Mesas
    addMesa: (mesa, zonaIndex) => ipcRenderer.invoke('add-mesa', mesa, zonaIndex),
    removeMesa: (zonaIndex, mesaIndex) => ipcRenderer.invoke('remove-mesa', zonaIndex, mesaIndex),
    editMesa: (zonaIndex, mesaIndex, nuevoNombre) => ipcRenderer.invoke('edit-mesa', zonaIndex, mesaIndex, nuevoNombre),
    updateMesa: (zonaNombre, mesaNumero, updates) => ipcRenderer.invoke('update-mesa', zonaNombre, mesaNumero, updates),

    // Medidas
    addMedida: (nombre) => ipcRenderer.invoke('add-medida', nombre),
    readMedida: () => ipcRenderer.invoke('read-medidas'),
    removeMedida: (medidaIndex) => ipcRenderer.invoke('remove-medida', medidaIndex),

    // Inventario
    addInventario: (producto) => ipcRenderer.invoke('add-inventario', producto),
    readInventario: () => ipcRenderer.invoke('read-inventario'),
    deleteInventario: (idInventario) => ipcRenderer.invoke('delete-inventario', idInventario),
    editInventario: (updatedProduct) => ipcRenderer.invoke('edit-inventario', updatedProduct),

    // Tipos de Producto
    addTipoProducto: (nombre) => ipcRenderer.invoke('add-tipo-producto', nombre),
    readTiposProducto: () => ipcRenderer.invoke('read-tipos-producto'),
    removeTipoProducto: (tipoProductoIndex) => ipcRenderer.invoke('remove-tipo-producto', tipoProductoIndex),

    // Tipos de Plato
    readTipoPlato: () => ipcRenderer.invoke('read-tipo-plato'),
    addTipoPlato: (nombre) => ipcRenderer.invoke('add-tipo-plato', nombre),
    editTipoPlato: (updatedTipoPlato) => ipcRenderer.invoke('edit-tipo-plato', updatedTipoPlato),
    removeTipoPlato: (id) => ipcRenderer.invoke('remove-tipo-plato', id),

    // Platos
    addPlato: (plato) => ipcRenderer.invoke('add-plato', plato),
    readMenu: () => ipcRenderer.invoke('read-menu'),
    updatePlato: (plato) => ipcRenderer.invoke('plato:update', plato),
    deletePlato: (id) => ipcRenderer.invoke('plato:delete', id),

    // Usuarios
    readUsuarios: () => ipcRenderer.invoke('read-usuarios'),
    readTiposUsuario: () => ipcRenderer.invoke('read-tipos-usuario'),
    addUsuario: (usuario) => ipcRenderer.invoke('add-usuario', usuario),
    updateUsuario: (usuario) => ipcRenderer.invoke('edit-usuario', usuario),
    deleteUsuario: (id) => ipcRenderer.invoke('remove-usuario', id),

    // Pedidos
    readPedidosEnProceso: () => ipcRenderer.invoke('read-pedidos-en-proceso'),
    readPedidosFinalizados: () => ipcRenderer.invoke('read-pedidos-finalizados'),
    addPedido: (nuevoPedido) => ipcRenderer.invoke('add-pedido', nuevoPedido),
    finalizarPedido: (idPedido) => ipcRenderer.invoke('finalizar-pedido', idPedido),
    updatePedido: (id, updatedData) => ipcRenderer.invoke('update-pedido', id, updatedData),

    // Ingredientes
    getIngredientesByPlato: (platoId) => ipcRenderer.invoke('get-ingredientes-by-plato', platoId),
    updateStockFromOrder: (order) => ipcRenderer.invoke('update-stock-from-order', order),
    reduceStock: (ingredientes, cantidad) => ipcRenderer.invoke('reduce-stock', ingredientes, cantidad),

    //Metodos de Pago
    createMetodoPago: (metodo) => ipcRenderer.invoke('createMetodoPago', metodo),
    getMetodosPago: () => ipcRenderer.invoke('getMetodosPago'),
    updateMetodoPago: (metodo) => ipcRenderer.invoke('updateMetodoPago', metodo),
    deleteMetodoPago: (id) => ipcRenderer.invoke('deleteMetodoPago', id),
    onMetodoPagoCreado: (callback) => ipcRenderer.invoke('metodoPagoCreado', callback),
    onMetodosPagoData: (callback) => ipcRenderer.invoke('metodosPagoData', callback),
    onMetodoPagoActualizado: (callback) => ipcRenderer.invoke('metodoPagoActualizado', callback),
    onMetodoPagoEliminado: (callback) => ipcRenderer.invoke('metodoPagoEliminado', callback),

    //iplocal
    getIpLocal: () => ipcRenderer.invoke('getIpLocal'),
});
