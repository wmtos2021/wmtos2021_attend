// gps.js


// 학원 위치
const ACADEMY_LAT = 35.2462180185129;
const ACADEMY_LNG = 128.624228723988;

// 허용 반경
const ALLOW_DISTANCE = 100;


// 두 위치 사이 거리 계산
function getDistance(
    lat1,
    lng1,
    lat2,
    lng2
) {

    const R = 6371000;
    const toRad = (value) => value * Math.PI / 180;

    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);

    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLng / 2) ** 2;

    const c =
        2 *
        Math.atan2(
            Math.sqrt(a),
            Math.sqrt(1 - a)
        );

    return R * c;
}


// 학원과의 거리 확인
export function checkAcademyDistance(
    latitude,
    longitude
) {

    return getDistance(
        latitude,
        longitude,
        ACADEMY_LAT,
        ACADEMY_LNG
    );
}


// 허용 반경
export {ALLOW_DISTANCE};