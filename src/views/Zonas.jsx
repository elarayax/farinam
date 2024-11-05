import { useEffect, useState } from 'react';

const ZonasComponent = () => {
    const [zonas, setZonas] = useState([]);
    const [zonaActual, setZonaActual] = useState(null);
    const [mostrarPopup, setMostrarPopup] = useState(false);

    useEffect(() => {
        const fetchZonas = async () => {
            try {
                const data = await window.electron.readZonas();
                console.log("Datos de zonas:", data); // Verifica que aquí estén los datos
                setZonas(data);
                if (data.length > 0) {
                    setZonaActual(data[0]); // Establecer la primera zona como la zona actual
                }
            } catch (error) {
                console.error("Error al obtener zonas:", error);
            }
        };

        fetchZonas();
    }, []);

    const cambiarZona = (zona) => {
        setZonaActual(zona);
        setMostrarPopup(false); // Cerrar el popup después de cambiar la zona
    };

    return (
        <div>
            <div className='contenido'>
                <div className='principal'>
                    {zonaActual && (
                        <div>
                            <div className='titulo-zona sd-20'>
                                <h2>{zonaActual.nombre}</h2>
                                <button onClick={() => setMostrarPopup(true)}>Ver otras zonas</button>
                            </div>
                            <div className='mesas'>
                                {zonaActual.mesas.length > 0 ? (
                                    zonaActual.mesas.map((mesa, index) => (
                                        <div 
                                            key={index} 
                                            className={`mesa ${mesa.estado}`} // Asumiendo que cada mesa tiene un campo 'estado'
                                        >
                                            <p className="text-center">
                                                {mesa.numero} <br />
                                                {mesa.estado}
                                            </p>
                                        </div>
                                    ))
                                ) : (
                                    <p>No hay mesas en esta zona.</p>
                                )}
                            </div>
                        </div>
                    )}
                </div>
                <div className='ayuda'>
                    {/* Aquí puedes agregar botones o elementos adicionales si es necesario */}
                </div>

                {/* Popup para seleccionar otra zona */}
                {mostrarPopup && (
                    <div className="popup">
                        <h2>Seleccionar Zona</h2>
                        <ul>
                            {zonas.map((zona, index) => (
                                <li 
                                    key={index} 
                                    onClick={() => cambiarZona(zona)} 
                                    style={{ cursor: 'pointer' }}
                                >
                                    {zona.nombre}
                                </li>
                            ))}
                        </ul>
                        <button onClick={() => setMostrarPopup(false)}>Cerrar</button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ZonasComponent;
