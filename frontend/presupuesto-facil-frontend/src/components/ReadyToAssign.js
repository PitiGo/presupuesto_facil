import React, { useState, useEffect } from 'react';
import { getReadyToAssign } from '../services/api';

const ReadyToAssign = () => {
    const [readyToAssign, setReadyToAssign] = useState(0);

    useEffect(() => {
        fetchReadyToAssign();
    }, []);

    const fetchReadyToAssign = async () => {
        const amount = await getReadyToAssign();
        setReadyToAssign(amount);
    };

    return (
        <div className="ready-to-assign">
            <h2>Listo para Asignar</h2>
            <p>${readyToAssign.toFixed(2)}</p>
        </div>
    );
};

export default ReadyToAssign;