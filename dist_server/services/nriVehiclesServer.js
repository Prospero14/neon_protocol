/** Сервер: каталог транспорта (копия client catalog). */
const VEHICLES = {
    thornton_galena: { name: 'Thorton Galena', speed: 80, seats: 4 },
    yaiba_kusanagi: { name: 'Yaiba Kusanagi CT-3X', speed: 120, seats: 1 },
    mackinaw_pickup: { name: 'Mackinaw Beast', speed: 70, seats: 4 },
    quadra_type66: { name: 'Quadra Type-66', speed: 110, seats: 2 },
    av4_aerodyne: { name: 'AV-4 Aerodyne', speed: 150, seats: 6 },
    maverick_truck: { name: 'Maverick Truck', speed: 65, seats: 3 },
};
export function getServerVehicleDef(catalogId) {
    return VEHICLES[catalogId];
}
//# sourceMappingURL=nriVehiclesServer.js.map