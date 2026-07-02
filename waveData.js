// waveData.js
// 1웨이브부터 50웨이브까지의 몬스터 구성을 정의하는 설정 파일입니다.
// 로컬 file:// 실행 환경 호환성을 위해 JSON 대신 JS 전역 변수를 활용합니다.

window.WAVE_DATA = {
    // [초보자 구간] 기본 몬스터 중심 및 빌드업
    1: ['basic', 'basic', 'basic', 'basic'],
    2: ['basic', 'basic', 'basic', 'basic', 'basic'],
    3: ['basic', 'speedy', 'basic', 'basic', 'speedy'],
    4: ['basic', 'speedy', 'map_special', 'basic', 'basic'],
    5: ['boss', 'basic', 'basic'], // 5웨이브 보스전

    // [성장 구간] 중형 몬스터 추가 및 기믹 도입
    6: ['basic', 'speedy', 'tank', 'basic'],
    7: ['basic', 'tank', 'map_special', 'speedy'],
    8: ['basic', 'speedy', 'transparent', 'tank'],
    9: ['basic', 'tank', 'stunner', 'map_special', 'basic'],
    10: ['boss', 'tank', 'speedy', 'basic'], // 10웨이브 보스전

    // [확장 구간] 특수 능력 몬스터 등장
    11: ['basic', 'tank', 'jumper', 'speedy', 'map_special'],
    12: ['basic', 'regenerator', 'tank', 'jumper'],
    13: ['basic', 'map_special', 'regenerator', 'transparent', 'speedy'],
    14: ['basic', 'tank', 'healer', 'jumper', 'map_special'],
    15: ['boss', 'healer', 'tank', 'speedy'], // 15웨이브 보스전

    // [전술 구간] 상호 시너지 유닛 조합
    16: ['basic', 'splitter', 'tank', 'speedy', 'map_special'],
    17: ['basic', 'splitter', 'regenerator', 'healer'],
    18: ['basic', 'aggro', 'tank', 'speedy', 'map_special'],
    19: ['splitter', 'aggro', 'healer', 'transparent'],
    20: ['boss', 'aggro', 'healer', 'tank', 'speedy'], // 20웨이브 보스전

    // [고급 구간 1] 물량 및 돌파력 강화 (21~25)
    21: ['basic', 'speedy', 'speedy', 'map_special', 'map_special', 'tank'],
    22: ['tank', 'tank', 'transparent', 'transparent', 'jumper', 'jumper'],
    23: ['basic', 'regenerator', 'regenerator', 'healer', 'map_special', 'speedy'],
    24: ['splitter', 'splitter', 'stunner', 'stunner', 'aggro', 'tank'],
    25: ['boss', 'healer', 'tank', 'speedy', 'map_special'], // 25웨이브 보스전

    // [고급 구간 2] 강한 속도 및 기동성 제어 (26~30)
    26: ['speedy', 'speedy', 'speedy', 'jumper', 'jumper', 'transparent', 'transparent'],
    27: ['tank', 'tank', 'healer', 'healer', 'map_special', 'map_special', 'basic'],
    28: ['regenerator', 'regenerator', 'splitter', 'splitter', 'aggro', 'aggro'],
    29: ['stunner', 'stunner', 'transparent', 'transparent', 'speedy', 'speedy', 'jumper'],
    30: ['boss', 'aggro', 'healer', 'tank', 'tank', 'speedy'], // 30웨이브 정예 보스전

    // [하드코어 구간 1] 광역 콤보 및 튼튼한 라인 (31~35)
    31: ['tank', 'tank', 'tank', 'healer', 'healer', 'map_special', 'map_special'],
    32: ['jumper', 'jumper', 'jumper', 'speedy', 'speedy', 'transparent', 'transparent', 'transparent'],
    33: ['regenerator', 'regenerator', 'regenerator', 'splitter', 'splitter', 'splitter', 'basic'],
    34: ['aggro', 'aggro', 'stunner', 'stunner', 'healer', 'healer', 'tank', 'tank'],
    35: ['boss', 'healer', 'healer', 'tank', 'tank', 'map_special'], // 35웨이브 보스전

    // [하드코어 구간 2] 한계 시험 (36~40)
    36: ['splitter', 'splitter', 'splitter', 'splitter', 'speedy', 'speedy', 'speedy', 'speedy'],
    37: ['tank', 'tank', 'tank', 'tank', 'transparent', 'transparent', 'map_special', 'map_special'],
    38: ['jumper', 'jumper', 'jumper', 'jumper', 'regenerator', 'regenerator', 'regenerator', 'healer'],
    39: ['aggro', 'aggro', 'aggro', 'stunner', 'stunner', 'healer', 'healer', 'splitter', 'splitter'],
    40: ['boss', 'aggro', 'aggro', 'healer', 'healer', 'tank', 'tank'], // 40웨이브 보스군 강림

    // [종말 돌입 구간] 극한의 시너지와 물량 공세 (41~45)
    41: ['basic', 'basic', 'speedy', 'speedy', 'tank', 'tank', 'transparent', 'transparent', 'map_special', 'map_special'],
    42: ['jumper', 'jumper', 'jumper', 'jumper', 'stunner', 'stunner', 'healer', 'healer', 'aggro', 'aggro'],
    43: ['regenerator', 'regenerator', 'regenerator', 'regenerator', 'splitter', 'splitter', 'splitter', 'splitter', 'healer'],
    44: ['tank', 'tank', 'tank', 'tank', 'speedy', 'speedy', 'speedy', 'speedy', 'transparent', 'transparent', 'map_special'],
    45: ['boss', 'healer', 'healer', 'healer', 'tank', 'tank', 'tank'], // 45웨이브 보스전

    // [종말 최종 구간] 엔드게임 (46~49)
    46: ['splitter', 'splitter', 'splitter', 'splitter', 'jumper', 'jumper', 'jumper', 'jumper', 'speedy', 'speedy'],
    47: ['tank', 'tank', 'tank', 'tank', 'regenerator', 'regenerator', 'regenerator', 'regenerator', 'healer', 'healer'],
    48: ['aggro', 'aggro', 'aggro', 'aggro', 'stunner', 'stunner', 'stunner', 'stunner', 'transparent', 'transparent'],
    49: ['splitter', 'splitter', 'splitter', 'splitter', 'healer', 'healer', 'healer', 'healer', 'tank', 'tank', 'map_special', 'map_special'],

    // [최종 심판] 50웨이브 최종 종결전
    50: [
        'boss', 'boss', 'boss', 'boss', 'boss', // 5개 모든 보스 총집합
        'tank', 'tank', 'tank', 'tank', 'tank', 
        'healer', 'healer', 'healer', 'healer', 
        'aggro', 'aggro', 'aggro', 'aggro', 
        'map_special', 'map_special', 'map_special', 'map_special'
    ]
};
