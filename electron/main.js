import { app, BrowserWindow, ipcMain } from 'electron';
import { networkInterfaces } from'os';
import fs from 'fs';
import path from 'path';
import { fork } from 'child_process';



const getLocalIP = () => {
    const interfaces = networkInterfaces();
    for (const nombre in interfaces) {
        for (const info of interfaces[nombre]) {
            if (info.family === 'IPv4' && !info.internal) {
                return info.address; // Retorna la IP local
            }
        }
    }
    return null; // Si no se encuentra
};

ipcMain.handle('getIpLocal', () => {
    return getLocalIP(); // Maneja la solicitud de IP local
});

// Función para obtener __dirname en un módulo ES
const __dirname = path.dirname(new URL(import.meta.url).pathname);

// Función para leer el archivo JSON de zonas y mesas
const readZonas = async () => {
    try {
        const data = await fs.promises.readFile(path.join(__dirname, 'db/zonas.json'), 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        console.error("Error al leer las zonas:", error);
        return []; // Retorna un array vacío en caso de error
    }
};

const saveZonas = async (zonas) => {
    try {
        await fs.promises.writeFile(path.join(__dirname, 'db/zonas.json'), JSON.stringify(zonas, null, 2));
    } catch (error) {
        console.error("Error al guardar las zonas:", error);
    }
};

// Función para guardar el archivo JSON de zonas y mesas
ipcMain.handle('save-zonas', async (event, zonas) => {
    try {
        await fs.promises.writeFile(path.join(__dirname, 'db/zonas.json'), JSON.stringify(zonas, null, 2));
        return true; // Retorna true si se guarda correctamente
    } catch (error) {
        console.error("Error al guardar zonas:", error);
        return false; // Retorna false en caso de error
    }
})

// Manejo de IPC para leer zonas desde el archivo JSON
ipcMain.handle('read-zonas', async () => {
    return await readZonas();
});

ipcMain.handle('update-mesa', async (event, zonaNombre, mesaNumero, updates) => {
    const zonas = await readZonas();
    const zona = zonas.find(z => z.nombre === zonaNombre);
    if (!zona) return;

    const mesa = zona.mesas.find(m => m.numero === mesaNumero);
    if (!mesa) return;

    Object.assign(mesa, updates);
    await saveZonas(zonas);
});
// Manejo de IPC para agregar una nueva zona
ipcMain.handle('add-zona', async (event, zona) => {
    const zonas = await readZonas();
    zonas.push({ nombre: zona, mesas: [] });
    await saveZonas(zonas);
});

const saveMedidas = async (data) => {
    try {
        await fs.promises.writeFile(path.join(__dirname, 'db/medidas.json'), JSON.stringify(data, null, 2));
        console.log("Medidas guardadas correctamente.");
    } catch (error) {
        console.error("Error al guardar medidas:", error);
    }
};

const loadMedidas = async () => {
    try {
        const data = await fs.promises.readFile(path.join(__dirname, 'db/medidas.json'), 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error("Error al cargar medidas:", error);
        return [];
    }
};

ipcMain.handle('add-medida', async (event, nombre) => {
    try {
        const medidas = await loadMedidas();

        // Encontrar el ID más grande existente
        const maxId = medidas.reduce((max, medida) => Math.max(max, medida.id), 0);

        const newId = maxId + 1;
        medidas.push({ id: newId, nombre: nombre });
        await saveMedidas(medidas);
        return medidas;
    } catch (error) {
        console.error("Error al agregar medida:", error);
        return null;
    }
});

ipcMain.handle('read-medidas', async () => {
    return  await loadMedidas();
});

// Manejo de IPC para agregar una nueva mesa a una zona
ipcMain.handle('add-mesa', async (event, mesa, zonaIndex) => {
    const zonas = await readZonas();
    console.log("Mesa a agregar:", mesa);
    console.log("Zona seleccionada:", zonaIndex);

    if (zonas[zonaIndex]) {
        zonas[zonaIndex].mesas.push(mesa);
        await saveZonas(zonas);
        console.log("Zonas actualizadas:", zonas);
    } else {
        console.error("Zona no encontrada para el índice:", zonaIndex);
    }
});

// Manejo de IPC para eliminar una mesa
ipcMain.handle('remove-mesa', async (event, zonaIndex, mesaIndex) => {
    const zonas = await readZonas();
    if (zonas[zonaIndex]) {
        zonas[zonaIndex].mesas.splice(mesaIndex, 1); // Elimina la mesa por su índice
        await saveZonas(zonas);
    }
});

ipcMain.handle('remove-zona', async (event, zonaIndex) => {
    const zonas = await readZonas();
    if(zonas[zonaIndex]){
        zonas.splice(zonaIndex, 1); // Elimina la zona por su índice
        await saveZonas(zonas);
    } else {
        console.error("Zona no encontrada para el índice:", zonaIndex);
    }
});

ipcMain.handle('remove-medida', async (event, medidaIndex) => {
    try {
        const medidas = await loadMedidas();

        // Validación del índice
        if (medidaIndex >= 0 && medidaIndex < medidas.length) {
            medidas.splice(medidaIndex, 1);
            await saveMedidas(medidas);
            // Enviar mensaje de confirmación al frontend
            event.sender.send('medida-eliminada', true);
        } else {
            console.error("Índice de medida fuera de rango:", medidaIndex);
            // Enviar mensaje de error al frontend
            event.sender.send('medida-eliminada', false);
        }
    } catch (error) {
        console.error("Error al eliminar la medida:", error);
        // Enviar mensaje de error al frontend
        event.sender.send('medida-eliminada', false);
    }
});

// Manejo de IPC para editar el nombre de una mesa
ipcMain.handle('edit-mesa', async (event, zonaIndex, mesaIndex, nuevoNombre) => {
    const zonas = await readZonas();
    if (zonas[zonaIndex]) {
        const mesa = zonas[zonaIndex].mesas[mesaIndex];
        if (mesa) {
            mesa.numero = nuevoNombre; // Actualiza el nombre de la mesa
            await saveZonas(zonas);
        }
    }
});

const readInventario = async () => {
    try {
        const data = await fs.promises.readFile(path.join(__dirname, 'db/inventario.json'), 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        console.error("Error al leer el inventario:", error);
        return []; // Retorna un array vacío en caso de error
    }
};

const readTipoProducto = async () => {
    try {
        const data = await fs.promises.readFile(path.join(__dirname, 'db/tipoProducto.json'), 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        console.error("Error al leer tipos de producto:", error);
        return []; // Retorna un array vacío en caso de error
    }
};

const saveTipoProducto = async (tipoProducto) => {
    try {
        await fs.promises.writeFile(path.join(__dirname, 'db/tipoProducto.json'), JSON.stringify(tipoProducto, null, 2));
    } catch (error) {
        console.error("Error al guardar tipo de producto:", error);
    }
};

ipcMain.handle('add-tipo-producto', async (event, nombre) => {
    try {
        const tipoProductos = await readTipoProducto();

        // Encontrar el ID más grande existente
        const maxId = tipoProductos.reduce((max, tipoProducto) => Math.max(max, tipoProducto.id), 0);

        const newId = maxId + 1;
        tipoProductos.push({ id: newId, nombre: nombre });
        await saveTipoProducto(tipoProductos);
        return tipoProductos;
    } catch (error) {
        console.error("Error al agregar tipo producto:", error);
        return null;
    }
});

ipcMain.handle('read-tipos-producto', async () => {
    return await readTipoProducto();
});

ipcMain.handle('remove-tipo-producto', async (event, tipoProductoIndex) => {
    try {
        const tipoProductos = await readTipoProducto();

        // Validación del índice
        if (tipoProductoIndex >= 0 && tipoProductoIndex < tipoProductos.length) {
            tipoProductos.splice(tipoProductoIndex, 1);
            await saveTipoProducto(tipoProductos);
            // Enviar mensaje de confirmación al frontend
            event.sender.send('tipo-producto-eliminado', true);
        } else {
            console.error("Índice de tipo producto fuera de rango:", tipoProductoIndex);
            // Enviar mensaje de error al frontend
            event.sender.send('tipo-producto-eliminado', false);
        }
    } catch (error) {
        console.error("Error al eliminar la medida:", error);
        // Enviar mensaje de error al frontend
        event.sender.send('tipo-producto-eliminado', false);
    }
});

ipcMain.handle('add-inventario', async (event, producto) => {
    const inventario = await readInventario(); // Cargar inventario existente
    const maxId = inventario.reduce((max, item) => Math.max(max, item.id || 0), 0); // Encontrar el ID más alto
    const newId = maxId + 1;

    inventario.push({ id: newId, ...producto }); // Agregar el nuevo producto
    await saveInventario(inventario); // Guardar el inventario actualizado

    return inventario; // Devolver el inventario actualizado
});

const saveInventario = async (inventario) => {
    try {
        await fs.promises.writeFile(path.join(__dirname, 'db/inventario.json'), JSON.stringify(inventario, null, 2));
    } catch (error) {
        console.error("Error al guardar el inventario:", error);
    }
};

ipcMain.handle('read-inventario', async () => {
    return await readInventario();
});

ipcMain.handle('deleteInventario', async (event, id) => {
    const inventario = await readInventario(); // Asegúrate de tener una función que lea el inventario
    const nuevoInventario = inventario.filter(producto => producto.id !== id);
    await saveInventario(nuevoInventario); // Asegúrate de tener una función que escriba el inventario
    return nuevoInventario;
});

// Maneja la edición del inventario
ipcMain.handle('edit-inventario', async (event, updatedProduct) => {
    try {
        const inventario = await readInventario();
        const index = inventario.findIndex(producto => producto.id === updatedProduct.id);
        if (index === -1) {
            throw new Error('Producto no encontrado');
        }

        // Actualiza el producto en el inventario
        inventario[index] = { ...inventario[index], ...updatedProduct };

        // Escribe el inventario actualizado en el archivo
        await saveInventario(inventario);

        return inventario; // Devuelve el inventario actualizado
    } catch (error) {
        console.error("Error al editar el inventario:", error);
        throw error; // Lanza el error para manejarlo en el frontend si es necesario
    }
});

ipcMain.handle('read-tipo-plato', async () => {
    return await readTipoPlato();
});

const readTipoPlato = async () => {
    try {
        const data = await fs.promises.readFile(path.join(__dirname, 'db/tipoPlato.json'), 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        console.error("Error al leer el tipo de plato:", error);
        return []; // Retorna un array vacío en caso de error
    }
};

const saveTipoPlato = async (tipoPlato) => {
    try {
        await fs.promises.writeFile(path.join(__dirname, 'db/tipoPlato.json'), JSON.stringify(tipoPlato, null, 2));
    } catch (error) {
        console.error("Error al guardar el tipo de plato:", error);
    }
};

ipcMain.handle('add-tipo-plato', async (event, nombre) => {
    try {
        const tipoPlato = await readTipoPlato();
        const maxId = tipoPlato.reduce((max, tipoPlato) => Math.max(max, tipoPlato.id), 0);
        const newId = maxId + 1;
        tipoPlato.push({ id: newId, nombre: nombre });
        await saveTipoPlato(tipoPlato);
        return tipoPlato;
    } catch (error) {
        console.error("Error al agregar tipo de plato:", error);
        return null;
    }
});

ipcMain.handle('remove-tipo-plato', async (event, id) => {
    const tipoPlato = await readTipoPlato(); // Asegúrate de tener una función que lea el inventario
    const nuevoTipoPlato = tipoPlato.filter(tipoPlato => tipoPlato.id !== id);
    await saveTipoPlato(nuevoTipoPlato); // Asegúrate de tener una función que escriba el inventario
    return nuevoTipoPlato;
});

ipcMain.handle('edit-tipo-plato', async (event, updatedTipoPlato) => {
    try {
        const tipoPlato = await readTipoPlato();
        const index = tipoPlato.findIndex(tipoPlato => tipoPlato.id === updatedTipoPlato.id);
        if (index === -1) {
            throw new Error('tipo de plato no encontrado');
        }
        tipoPlato[index] = { ...tipoPlato[index], ...updatedTipoPlato };

        await saveTipoPlato(tipoPlato);

        return tipoPlato; // Devuelve el inventario actualizado
    } catch (error) {
        console.error("Error al editar el tipo de plato:", error);
        throw error; // Lanza el error para manejarlo en el frontend si es necesario
    }
});

// Funciones para manejar el menú
const readMenu = async () => {
    try {
        const data = await fs.promises.readFile(path.join(__dirname, 'db/menu.json'), 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        console.error("Error al leer el menú:", error);
        return []; // Retorna un array vacío en caso de error
    }
};

const saveMenu = async (menu) => {
    try {
        await fs.promises.writeFile(path.join(__dirname, 'db/menu.json'), JSON.stringify(menu, null, 2));
    } catch (error) {
        console.error("Error al guardar el menú:", error);
    }
};

// Manejo de IPC para agregar un nuevo plato al menú
ipcMain.handle('add-plato', async (event, plato) => {
    const menu = await readMenu();
    const maxId = menu.reduce((max, item) => Math.max(max, item.id || 0), 0); // Encontrar el ID más alto
    const newId = maxId + 1;

    // Asegúrate de que el objeto plato tenga la estructura correcta
    const nuevoPlato = { id: newId, ...plato }; // Agregar el nuevo plato con su ID
    menu.push(nuevoPlato);
    await saveMenu(menu);
    return menu; // Devolver el menú actualizado
});

// Manejo de IPC para leer el menú
ipcMain.handle('read-menu', async () => {
    return await readMenu();
});

// Manejo de IPC para eliminar un plato del menú
ipcMain.handle('plato:delete', async (event, id) => {
    // Lógica para eliminar un plato de tu sistema, como actualizar el JSON
    const platos = await readMenu(); // Supongamos que tienes una función que lee los platos
    const nuevosPlatos = platos.filter(plato => plato.id !== id); // Filtra el plato que quieres eliminar
    await saveMenu(nuevosPlatos); // Supongamos que tienes una función que escribe los platos
    return nuevosPlatos; // Devuelve la lista actualizada de platos
});

// Manejo de IPC para editar un plato del menú
ipcMain.handle('plato:update', async (event, plato) => {
    // Lógica para actualizar un plato en tu sistema, como actualizar el JSON
    // Por ejemplo:
    const platos = await readMenu(); // Supongamos que tienes una función que lee los platos
    const index = platos.findIndex(p => p.id === plato.id);
    if (index !== -1) {
        platos[index] = plato; // Reemplaza el plato
        await saveMenu(platos); // Supongamos que tienes una función que escribe los platos
    }
    return platos; // Devuelve la lista actualizada de platos
});

// Funciones para CRUD de Usuarios
const readUsuarios = async () => {
    try {
        const data = await fs.promises.readFile(path.join(__dirname, 'db/usuarios.json'), 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        console.error("Error al leer usuarios:", error);
        return [];
    }
};

const saveUsuarios = async (usuarios) => {
    try {
        await fs.promises.writeFile(path.join(__dirname, 'db/usuarios.json'), JSON.stringify(usuarios, null, 2));
    } catch (error) {
        console.error("Error al guardar usuarios:", error);
    }
};

const readTipoUsuario = async () => {
    try {
        const data = await fs.promises.readFile(path.join(__dirname, 'db/tipoUsuario.json'), 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        console.error("Error al leer tipos de usuario:", error);
        return [];
    }
};

// CRUD de Usuarios

// Leer usuarios
ipcMain.handle('read-usuarios', async () => {
    return await readUsuarios();
});

// Leer tipos de usuario
ipcMain.handle('read-tipos-usuario', async () => {
    return await readTipoUsuario();
});

// Agregar un nuevo usuario
ipcMain.handle('add-usuario', async (event, usuario) => {
    try {
        const usuarios = await readUsuarios();
        const maxId = usuarios.reduce((max, user) => Math.max(max, user.id || 0), 0);
        const newId = maxId + 1;

        const nuevoUsuario = { id: newId, ...usuario };
        usuarios.push(nuevoUsuario);
        await saveUsuarios(usuarios);
        return usuarios;
    } catch (error) {
        console.error("Error al agregar usuario:", error);
        return null;
    }
});

// Editar un usuario
ipcMain.handle('edit-usuario', async (event, updatedUsuario) => {
    try {
        const usuarios = await readUsuarios();
        const index = usuarios.findIndex(user => user.id === updatedUsuario.id);
        if (index !== -1) {
            usuarios[index] = { ...usuarios[index], ...updatedUsuario };
            await saveUsuarios(usuarios);
        }
        return usuarios;
    } catch (error) {
        console.error("Error al editar usuario:", error);
        return null;
    }
});

// Eliminar un usuario
ipcMain.handle('remove-usuario', async (event, id) => {
    try {
        const usuarios = await readUsuarios();
        const nuevosUsuarios = usuarios.filter(user => user.id !== id);
        await saveUsuarios(nuevosUsuarios);
        return nuevosUsuarios;
    } catch (error) {
        console.error("Error al eliminar usuario:", error);
        return null;
    }
});

const readPedidosEnProceso = async () => {
    const data = await fs.promises.readFile(path.join(__dirname, 'db/pedidosEnProceso.json'), 'utf-8');
    return JSON.parse(data || '[]');
};

const readPedidosFinalizados = async () => {
    const data = await fs.promises.readFile(path.join(__dirname, 'db/pedidosFinalizados.json'), 'utf-8'); // Asegúrate de que este sea el archivo correcto
    return JSON.parse(data || '[]');
};

ipcMain.handle('finalizar-pedido', async (event, idPedido) => {
    const pedidosEnProceso = await readPedidosEnProceso();
    const pedido = pedidosEnProceso.find(p => p.id === idPedido);
    
    if (pedido) {
        // Filtrar los pedidos en proceso y guardar el resultado
        const updatedPedidosEnProceso = pedidosEnProceso.filter(p => p.id !== idPedido);
        await fs.promises.writeFile(path.join(__dirname, 'db/pedidosEnProceso.json'), JSON.stringify(updatedPedidosEnProceso, null, 2));

        // Leer pedidos finalizados y asignar un nuevo ID
        const pedidosFinalizados = await readPedidosFinalizados();
        const maxId = pedidosFinalizados.length > 0 ? Math.max(...pedidosFinalizados.map(p => p.id)) : 0;
        pedido.id = maxId + 1; // Asigna un nuevo ID único

        // Guardar el pedido finalizado con el nuevo ID
        pedidosFinalizados.push(pedido);
        await fs.promises.writeFile(path.join(__dirname, 'db/pedidosFinalizados.json'), JSON.stringify(pedidosFinalizados, null, 2));

        // Actualizar el estado de la mesa a "disponible"
        const { idMesa } = pedido;
        await actualizarEstadoMesa(idMesa, 'disponible');
    }
    return pedido;
});


// Función para actualizar el estado de la mesa
async function actualizarEstadoMesa(idMesa, nuevoEstado) {
    const zonas = await readZonas();
    console.log("Zonas leídas:", zonas); // Agregar esta línea para depurar

    // Buscar la zona y la mesa correspondiente
    for (const zona of zonas) {
        const mesa = zona.mesas.find(m => m.numero === idMesa);
        if (mesa) {
            mesa.estado = nuevoEstado; // Actualizar el estado de la mesa
            await fs.promises.writeFile(path.join(__dirname, 'db/zonas.json'), JSON.stringify(zonas, null, 2));
            break; // Salir del bucle una vez que se encuentra y se actualiza la mesa
        }
    }
}

ipcMain.handle('get-ingredientes-by-plato', async (event, platoId) => {
    const pedidos = await readPedidosEnProceso();
    
    const pedido = pedidos.find(p => p.platos.some(plato => plato.id === platoId));
    
    if (!pedido) {
        console.error(`No se encontró un pedido con el plato ID: ${platoId}`);
        return [];
    }
    
    const plato = pedido.platos.find(plato => plato.id === platoId);
    
    if (!plato || !Array.isArray(plato.ingredientes)) {
        console.error(`Se esperaban ingredientes para el plato ${platoId}, pero no se recibió un array.`);
        return [];
    }
    
    return plato.ingredientes.map(ingrediente => ({
        id: ingrediente.id,  // Asegúrate de que aquí estás obteniendo el id
        nombre: ingrediente.nombre,
        cantidad: ingrediente.cantidad
    }));
});

ipcMain.handle('read-pedidos-en-proceso', async () => {
    try {
        return await readPedidosEnProceso(); // Asegúrate de que esta función esté correctamente implementada
    } catch (error) {
        console.error("Error reading pedidos en proceso:", error);
        throw error;
    }
});

ipcMain.handle('read-pedidos-finalizados', async () => {
    try {
        return await readPedidosFinalizados(); // Asegúrate de que esta función esté correctamente implementada
    } catch (error) {
        console.error("Error reading pedidos en proceso:", error);
        throw error;
    }
});

// Define la función para agregar un pedido
const addPedido = async (pedidoData) => {
    const pedidosEnProceso = await readPedidosEnProceso(); // Leer los pedidos actuales

    // Generar un nuevo ID para el pedido
    const nuevoId = pedidosEnProceso.length > 0 ? Math.max(pedidosEnProceso.map(p => p.id)) + 1 : 1;

    // Crear el nuevo pedido con el ID generado
    const nuevoPedido = {
        ...pedidoData,
        id: nuevoId,
        estado: 'en proceso', // Establecer un estado inicial
        horaInicio: new Date().toISOString() // Hora de inicio
    };

    // Agregar el nuevo pedido al array
    pedidosEnProceso.push(nuevoPedido);

    // Guardar los pedidos actualizados en el archivo
    await savePedidosEnProceso(pedidosEnProceso);

    return nuevoPedido; // Retornar el nuevo pedido
};

ipcMain.handle('add-pedido', async (event, pedidoData) => {
    try {
        return await addPedido(pedidoData); // Asegúrate de que esta función esté correctamente implementada
    } catch (error) {
        console.error("Error adding pedido:", error);
        throw error;
    }
});

ipcMain.handle('update-pedido', async (event, id, updatedData) => {
    const pedidos = await readPedidosEnProceso();
    const inventario = await readInventario(); // Leer inventario actual
    const pedidoIndex = pedidos.findIndex(p => p.id === id);

    if (pedidoIndex === -1) {
        throw new Error('Pedido no encontrado');
    }

    const pedidoActual = pedidos[pedidoIndex];
    const platosAnteriores = pedidoActual.platos; // Platos antes de la actualización
    const platosNuevos = updatedData.platos; // Platos después de la actualización

    // 1. Devolver ingredientes al inventario si fueron eliminados o su cantidad fue reducida
    platosAnteriores.forEach(platoAnterior => {
        const platoNuevo = platosNuevos.find(p => p.id === platoAnterior.id);
        const diferenciaCantidad = platoNuevo 
            ? platoAnterior.cantidad - platoNuevo.cantidad 
            : platoAnterior.cantidad;

        if (diferenciaCantidad > 0) {
            platoAnterior.ingredientes.forEach(ingrediente => {
                const itemInventario = inventario.find(item => item.id === ingrediente.id);
                if (itemInventario) {
                    itemInventario.stock += ingrediente.cantidad * diferenciaCantidad;
                }
            });
        }
    });

    // 2. Restar ingredientes del inventario por los platos agregados o cuyo cantidad aumentó
    platosNuevos.forEach(platoNuevo => {
        const platoAnterior = platosAnteriores.find(p => p.id === platoNuevo.id);
        const diferenciaCantidad = platoAnterior 
            ? platoNuevo.cantidad - platoAnterior.cantidad 
            : platoNuevo.cantidad;

        if (diferenciaCantidad > 0) {
            platoNuevo.ingredientes.forEach(ingrediente => {
                const itemInventario = inventario.find(item => item.id === ingrediente.id);
                if (itemInventario) {
                    itemInventario.stock -= ingrediente.cantidad * diferenciaCantidad;
                }
            });
        }
    });

    // Actualizar el pedido con los nuevos datos
    pedidos[pedidoIndex] = { ...pedidoActual, ...updatedData };
    
    // Guardar cambios en pedidos e inventario
    await savePedidosEnProceso(pedidos);
    await saveInventario(inventario);

    return pedidos[pedidoIndex]; // Retornar el pedido actualizado
});

ipcMain.handle('reduce-stock', async (event, idIngrediente, cantidad) => {
    const inventario = await readInventario();
    console.log(`Reduciendo el stock del ingrediente con id: ${idIngrediente}, cantidad a reducir: ${cantidad}`);
    
    // Encuentra el ingrediente y verifica el stock disponible
    const ingrediente = inventario.find(item => item.id === idIngrediente);
    if (!ingrediente) {
        throw new Error('Ingrediente no encontrado en el inventario');
    }

    // Convertir la cantidad a un número para evitar problemas de comparación
    const cantidadReducir = parseInt(cantidad, 10);
    
    console.log(`reduciendo ${cantidadReducir} del ingrediente ${ingrediente.nombre} que tiene ${ingrediente.cantidad}`);

    // Verificar que la cantidad sea válida y que no exceda el stock
    if (isNaN(cantidadReducir) || cantidadReducir <= 0) {
        throw new Error('Cantidad a reducir no es válida');
    }
    if (ingrediente.cantidad < cantidadReducir) {
        throw new Error('Cantidad a reducir es mayor que el stock disponible');
    }

    // Si las validaciones pasan, reduce la cantidad
    ingrediente.cantidad -= cantidadReducir;

    // Guarda el inventario actualizado
    await saveInventario(inventario);

    return inventario; // Devuelve el inventario actualizado
});

const savePedidosEnProceso = (pedidos) => {
    return new Promise((resolve, reject) => {
        fs.writeFile(path.join(__dirname, 'db/pedidosEnProceso.json'), JSON.stringify(pedidos, null, 2), (err) => {
            if (err) {
                return reject(err);
            }
            resolve();
        });
    });
};

async function updatePedido(pedidoData) {
    // Lógica para actualizar el pedido en tu archivo JSON o base de datos
    // Puedes usar fs para leer y escribir en tu archivo JSON si es necesario
    try {
        const pedidos = await readPedidosEnProceso(); // O la función que uses para obtener los pedidos
        const index = pedidos.findIndex(p => p.id === pedidoData.id); // Suponiendo que `id` identifica el pedido

        if (index !== -1) {
            pedidos[index] = { ...pedidos[index], ...pedidoData }; // Actualiza los datos del pedido
            await savePedidosEnProceso(pedidos); // Guarda los cambios en tu archivo JSON
            return pedidos[index]; // Retorna el pedido actualizado
        } else {
            throw new Error("Pedido no encontrado");
        }
    } catch (error) {
        console.error("Error updating pedido:", error);
        throw error; // Lanza el error para manejarlo en el frontend
    }
}

// Función para guardar métodos de pago
function saveMetodosPago(metodos) {
    fs.writeFileSync(path.join(__dirname, 'db/metodosPago.json'), JSON.stringify(metodos, null, 2));
}

// CRUD: Crear método de pago
ipcMain.handle('createMetodoPago', async (event, metodo) => {
    const metodos = readMetodosPago();
    const newMetodo = { ...metodo, id: metodos.length > 0 ? metodos[metodos.length - 1].id + 1 : 1 };
    metodos.push(newMetodo);
    console.log("Métodos de pago antes de guardar:", metodos); // Log para depurar
    saveMetodosPago(metodos);
    return newMetodo;
});

// CRUD: Leer métodos de pago

ipcMain.handle('getMetodosPago', async () => {
    const metodos = await readMetodosPago(); // Asegúrate de que esta función retorne un array
    console.log("Métodos de pago enviados al frontend:", metodos);
    return metodos;
});

function readMetodosPago() {
    try {
        const data = fs.readFileSync(path.join(__dirname, 'db/metodosPago.json'));
        const parsedData = JSON.parse(data);
        console.log("Datos leídos de metodosPago.json:", parsedData); // Log para depurar
        return parsedData; // Asegúrate de que esto sea un array
    } catch (error) {
        console.error("Error al leer o parsear el archivo:", error);
        return []; // Devuelve un array vacío en caso de error
    }
}
// CRUD: Actualizar método de pago
ipcMain.on('updateMetodoPago', (event, updatedMetodo) => {
    let metodos = readMetodosPago();
    metodos = metodos.map(metodo => 
        metodo.id === updatedMetodo.id ? updatedMetodo : metodo
    );
    saveMetodosPago(metodos);
    event.reply('metodoPagoActualizado', updatedMetodo);
});

// CRUD: Eliminar método de pago
ipcMain.handle('deleteMetodoPago', async (event, id) => {
    const metodos = readMetodosPago();
    const updatedMetodos = metodos.filter(metodo => metodo.id !== id);
    saveMetodosPago(updatedMetodos);
    return id; // Devuelve el ID eliminado
});


const createWindow = () => {
    const win = new BrowserWindow({
        width: 1200,
        height: 800,
        minWidth: 900,
        minHeight: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.cjs'),
            contextIsolation: true,
            enableRemoteModule: false,
            nodeIntegration: false,
        },
    });
    win.loadURL('http://localhost:5173'); // Asegúrate de que esto apunta a tu servidor Vite
};

// Cuando la aplicación esté lista, crea la ventana principal
app.whenReady().then(createWindow);

app.on('ready', () => {
    // Inicia el servidor Express como un proceso hijo
    fork(path.join(__dirname, '../serverTrabajadores.cjs')); // Asegúrate de que el path es correcto
    createWindow();
});

// Cierra la aplicación cuando todas las ventanas estén cerradas, excepto en macOS
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// Crea una nueva ventana si la aplicación se activa y no hay ventanas abiertas
app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});
