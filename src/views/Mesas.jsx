import { useState, useEffect } from 'react';
import { addMesa, getMesas } from '../db';

function Mesas() {
    const [mesas, setMesas] = useState([]);
    const [nombre, setNombre] = useState('');

    useEffect(() => {
        const fetchMesas = async () => {
            const allMesas = await getMesas();
            setMesas(allMesas);
        };
        fetchMesas();
    }, []);

    const handleAddMesa = async () => {
        if (nombre.trim()) {
            const newMesa = { nombre };
            await addMesa(newMesa);
            setMesas(await getMesas());  // Actualiza la lista de mesas
            setNombre('');                // Limpia el campo de texto
        }
    };

    return (
        <div>
            <h1>Mesas</h1>
            <div>
                <input
                    type="text"
                    placeholder="Nombre de la Mesa"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                />
                <button onClick={handleAddMesa}>Agregar Mesa</button>
            </div>
            <ul>
                {mesas.map((mesa) => (
                    <li key={mesa.id}>{mesa.nombre}</li>
                ))}
            </ul>
        </div>
    );
}

export default Mesas;