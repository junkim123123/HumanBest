/**
 * ImportKey.com Data Harvester
 * 
 * 자동으로 ImportKey.com에 로그인하고 키워드 리스트를 순회하며 CSV 데이터를 다운로드합니다.
 * 
 * 사용법:
 *   npx tsx scripts/harvester.ts
 * 
 * 환경 변수 (.env.local):
 *   IMPORTKEY_EMAIL=your-email@example.com
 *   IMPORTKEY_PASSWORD=your-password
 */

import puppeteer, { Browser, Page } from "puppeteer";
import * as dotenv from "dotenv";
import * as path from "path";
import * as fs from "fs";

// 환경 변수 로드
const envPath = path.resolve(process.cwd(), ".env.local");
const envResult = dotenv.config({ path: envPath, debug: false });

// 디버깅: 환경 변수 로드 상태 확인
if (envResult.error) {
  console.warn(`⚠️  .env.local 파일을 찾을 수 없습니다: ${envPath}`);
  console.warn("   프로젝트 루트에 .env.local 파일을 생성해주세요.");
} else {
  console.log(`✅ 환경 변수 파일 로드됨: ${envPath}`);
  // 로드된 환경 변수 디버깅
  if (envResult.parsed) {
    console.log(`   📦 로드된 변수 수: ${Object.keys(envResult.parsed).length}`);
  }
}

const KEYWORDS = [
  // 1 광역 문구 표현
  "ARTICLES OF PLASTICS",
  "ARTICLES OF PLASTIC",
  "PLASTICWARE",
  "HOUSEHOLD PLASTICWARE",
  "KITCHEN PLASTICWARE",
  "HOUSEHOLD UTENSILS",
  "HOUSEHOLD UTENSILS PLASTIC",
  "HOUSEHOLD UTENSILS METAL",
  "KITCHEN UTENSILS PLASTIC",
  "KITCHEN UTENSILS METAL",
  "HOUSEHOLD ARTICLES PLASTIC",
  "HOUSEHOLD ARTICLES METAL",
  "HOMEWARE",
  "HOMEWARES",
  "HOUSEWARE ITEMS",
  "KITCHENWARE ITEMS",
  "BATHROOM ITEMS",
  "ASSORTED GOODS",
  "ASSORTED ITEMS",
  "MIXED MERCHANDISE",
  "SUNDRY GOODS",
  "VARIETY ITEMS",
  "NOVELTY PRODUCTS",

  // 2 리테일 매장 운영 소모품
  "RETAIL ACCESSORIES",
  "STORE ACCESSORIES",
  "MERCHANDISING ACCESSORIES",
  "DISPLAY ACCESSORY",
  "DISPLAY ACCESSORIES",
  "SHELF ACCESSORIES",
  "SHELF MANAGEMENT",
  "SHELF ORGANIZER",
  "SHELF ORGANIZERS",
  "SHELF DIVIDER",
  "SHELF DIVIDERS PLASTIC",
  "SHELF DIVIDERS METAL",
  "SHELF PUSHER",
  "SHELF PUSHERS",
  "PRICE HOLDER",
  "PRICE HOLDERS",
  "LABEL HOLDER",
  "LABEL HOLDERS",
  "SIGN FRAME",
  "SIGN FRAMES",
  "ACRYLIC FRAME",
  "ACRYLIC FRAMES",
  "ACRYLIC DISPLAY STAND",
  "ACRYLIC DISPLAY STANDS",
  "COUNTERTOP RACK",
  "COUNTERTOP RACKS",
  "FLOOR RACK",
  "FLOOR RACKS",
  "WIRE DISPLAY STAND",
  "WIRE DISPLAY STANDS",
  "METAL DISPLAY RACK",
  "METAL DISPLAY RACKS",
  "HOOK DISPLAY",
  "DISPLAY HOOKS METAL",
  "DISPLAY HOOKS WIRE",
  "SLATWALL ACCESSORIES",
  "SLATWALL BRACKETS",
  "SLATWALL HOOKS",
  "PEGBOARD ACCESSORIES",
  "PEGBOARD HOOKS",
  "GRIDWALL ACCESSORIES",
  "GRIDWALL HOOKS",

  // 3 POS 주변기기 확장
  "RETAIL POS EQUIPMENT",
  "POS ACCESSORIES",
  "POS PARTS",
  "BARCODE SCANNERS",
  "HANDHELD BARCODE SCANNER",
  "WIRELESS BARCODE SCANNER",
  "SCANNER STAND",
  "SCANNER STANDS",
  "LABEL PRINTERS",
  "THERMAL LABEL PRINTER",
  "THERMAL RECEIPT PRINTER",
  "THERMAL RECEIPT PAPER ROLL",
  "RECEIPT PAPER ROLL",
  "LABEL ROLL",
  "LABEL ROLLS",
  "BARCODE LABEL ROLL",
  "BARCODE LABELS ROLL",
  "POS PAPER",
  "CASH REGISTER DRAWER",
  "CASH BOX",
  "COIN TRAY",
  "BILL TRAY",
  "CARD READER ACCESSORIES",

  // 4 보안 태그류 확장
  "EAS SYSTEM",
  "EAS ACCESSORIES",
  "EAS HARD TAG",
  "EAS SOFT TAG",
  "SECURITY HARD TAG",
  "SECURITY SOFT TAG",
  "SECURITY LABEL",
  "SECURITY LABELS",
  "RFID LABELS",
  "RFID STICKERS",
  "RFID INLAY",
  "RFID INLAYS",
  "TAG DETACHER",
  "EAS DETACHER",
  "SECURITY DETACHER",
  "LOCKING CABLE",
  "SECURITY CABLE",
  "DISPLAY SECURITY CABLE",

  // 5 포장 물류 문서 표현
  "PACKAGING MATERIAL",
  "PACKAGING MATERIALS",
  "PACKING MATERIAL",
  "PACKING MATERIALS",
  "PACKING PRODUCTS",
  "SHIPPING MATERIALS",
  "SHIPPING CARTONS",
  "CARTONS PAPER",
  "CARTON BOX",
  "CARTON BOXES",
  "CORRUGATED CARTONS",
  "CORRUGATED BOXES",
  "CARDBOARD CARTONS",
  "MAILER BAG",
  "MAILER BAGS",
  "COURIER BAGS",
  "POLY MAILING BAGS",
  "POLY SHIPPING BAGS",
  "OPP BAGS",
  "OPP BAG",
  "RESEALABLE BAGS",
  "RESEALABLE BAG",
  "ZIPLOCK BAG",
  "ZIPLOCK BAGS",
  "PACKING TAPE",
  "SEALING TAPE",
  "CARTON SEALING TAPE",
  "CLEAR PACKING TAPE",
  "BOPP PACKING TAPE",
  "DOUBLE SIDED TAPE",
  "STRETCH WRAP FILM",
  "SHRINK WRAP FILM",
  "STRETCH FILM ROLL",
  "SHRINK FILM ROLL",
  "BUBBLE WRAP ROLL",
  "BUBBLE WRAP",
  "AIR CUSHION",
  "AIR CUSHION FILM",
  "AIR PILLOW FILM",
  "VOID FILL PAPER",
  "KRAFT PAPER ROLL",
  "PACKING SLIP",
  "PACKING SLIPS",
  "DOCUMENT ENCLOSURE",
  "INVOICE ENCLOSURE",
  "SHIPPING LABELS",
  "WARNING LABELS",
  "FRAGILE LABELS",

  // 6 청소 도구 문서 표현
  "CLEANING ARTICLES",
  "CLEANING PRODUCTS",
  "CLEANING TOOLS",
  "HOUSEHOLD CLEANING TOOLS",
  "SCRUB BRUSHES",
  "CLEANING BRUSHES",
  "BOTTLE BRUSHES",
  "TOILET BRUSH SET",
  "DISH BRUSH",
  "DISH BRUSHES",
  "SPONGES",
  "SCOURING PADS",
  "MICROFIBER CLOTH",
  "MICROFIBER CLOTHS",
  "DUSTERS",
  "MOP HEAD",
  "MOP HEADS",
  "MOPS",
  "BROOMS",
  "DUSTPANS",
  "CLEANING GLOVES",
  "TRASH BINS",
  "WASTE BINS",
  "GARBAGE BINS",
  "TRASH CAN",
  "TRASH CANS",
  "GARBAGE BAGS",
  "TRASH BAGS",

  // 7 주방 소도구 문서 표현
  "KITCHEN TOOLS",
  "KITCHEN GADGETS",
  "COOKING TOOLS",
  "FOOD PREP TOOLS",
  "SILICONE SPATULA",
  "SILICONE SPATULAS",
  "SILICONE BRUSH",
  "SILICONE BRUSHES",
  "KITCHEN TONGS",
  "WHISKS",
  "PEELERS",
  "GRATERS",
  "STRAINERS",
  "SINK STRAINER",
  "SINK STRAINERS",
  "COLANDERS",
  "MEASURING CUPS",
  "MEASURING SPOONS",
  "FOOD CONTAINERS",
  "FOOD STORAGE CONTAINERS",
  "MEAL PREP CONTAINERS",
  "PLASTIC FOOD CONTAINERS",
  "GLASS FOOD CONTAINERS",
  "LUNCH BOXES",
  "WATER BOTTLES",
  "TUMBLERS",
  "TRAVEL MUGS",

  // 8 욕실 생활 문서 표현
  "BATHROOM ACCESSORIES",
  "BATH ACCESSORIES",
  "SHOWER ACCESSORIES",
  "SHOWER CADDIES",
  "SHOWER RACK",
  "SHOWER RACKS",
  "SOAP DISPENSERS",
  "SOAP HOLDER",
  "SOAP HOLDERS",
  "TOOTHBRUSH HOLDER",
  "TOOTHBRUSH HOLDERS",
  "TISSUE BOX COVER",
  "TOWEL HOOK",
  "TOWEL HOOKS",
  "BATH MATS",
  "NON SLIP MATS",
  "BATHROOM ORGANIZER",
  "BATHROOM ORGANIZERS",

  // 9 오피스 문구 문서 표현
  "OFFICE SUPPLIES ITEMS",
  "SCHOOL STATIONERY",
  "WRITING INSTRUMENTS",
  "BALLPOINT PENS",
  "GEL PENS",
  "MARKER PENS",
  "HIGHLIGHTER PENS",
  "NOTE PADS",
  "STICKY NOTES",
  "FILE FOLDERS",
  "DOCUMENT FOLDERS",
  "BINDERS",
  "BINDER CLIPS",
  "PAPER CLIPS",
  "STAPLERS",
  "STAPLES",
  "TAPE DISPENSERS",
  "OFFICE TAPE",
  "GLUE STICKS",
  "SCISSORS",
  "CUTTING KNIVES",
  "CRAFT ITEMS",
  "ART MATERIALS",
  "CRAFT MATERIALS",

  // 10 전자 액세서리 문서 표현
  "ELECTRICAL GOODS",
  "ELECTRICAL ACCESSORIES",
  "USB ACCESSORIES",
  "USB C CABLE",
  "USB C CABLES",
  "CHARGING CABLE",
  "CHARGING CABLES",
  "POWER ADAPTER",
  "POWER ADAPTERS",
  "WALL CHARGER",
  "WALL CHARGERS",
  "USB CHARGER",
  "USB CHARGERS",
  "CAR CHARGER",
  "CAR CHARGERS",
  "POWER BANKS",
  "PORTABLE CHARGERS",
  "EARBUDS",
  "EARPHONES",
  "HEADPHONES",
  "PHONE CASE",
  "PHONE CASES",
  "SCREEN PROTECTOR",
  "SCREEN PROTECTORS",
  "TEMPERED GLASS",
  "PHONE HOLDER",
  "PHONE HOLDERS",
  "CABLE CLIPS",
  "CABLE ORGANIZERS",

  // 11 하드웨어 문서 표현
  "FASTENERS",
  "SCREWS METAL",
  "BOLTS METAL",
  "NUTS METAL",
  "WASHERS METAL",
  "WALL ANCHORS",
  "HOOKS METAL",
  "BRACKETS METAL",
  "SHELF BRACKETS",
  "HINGES",
  "DOOR HARDWARE",
  "CABINET HARDWARE",
  "ADHESIVE PRODUCTS",
  "SEALANT PRODUCTS",
  "SILICONE SEALANT",
  "CAULK SEALANT",
  "EPOXY ADHESIVE",
  "SUPER GLUE",
  "WEATHER STRIP",
  "WEATHER STRIPPING",
  "DOOR SEAL STRIP",
  "WINDOW SEAL STRIP",
  "PTFE THREAD SEAL TAPE",
  "CABLE TIES",
  "NYLON CABLE TIES",

  // 12 펫 오토 시즌 문서 표현
  "PET PRODUCTS ITEMS",
  "PET ACCESSORIES ITEMS",
  "DOG LEASH",
  "DOG LEASHES",
  "DOG COLLAR",
  "DOG COLLARS",
  "PET BOWL",
  "PET BOWLS",
  "PET FEEDER",
  "PET FEEDERS",
  "PET CARRIER",
  "PET CARRIERS",
  "CAT LITTER",
  "LITTER SCOOP",
  "CAT SCRATCHER",
  "AQUARIUM ACCESSORIES",
  "AUTO ACCESSORY ITEMS",
  "CAR CLEANING ITEMS",
  "MICROFIBER TOWELS",
  "CAR ORGANIZER",
  "CAR ORGANIZERS",
  "SEASONAL DECOR ITEMS",
  "PARTY DECOR ITEMS",
] as const





// ImportKey 로그인 정보
// dotenv가 따옴표를 제거하므로, 따옴표가 있어도 없어도 됨
let IMPORTKEY_EMAIL = process.env.IMPORTKEY_EMAIL?.trim() || "";
let IMPORTKEY_PASSWORD = process.env.IMPORTKEY_PASSWORD?.trim() || "";

// 따옴표 제거 (혹시 남아있을 경우)
IMPORTKEY_EMAIL = IMPORTKEY_EMAIL.replace(/^["']|["']$/g, "");
IMPORTKEY_PASSWORD = IMPORTKEY_PASSWORD.replace(/^["']|["']$/g, "");

// 디버깅: 환경 변수 확인
console.log("\n📋 환경 변수 확인:");
console.log(`   IMPORTKEY_EMAIL: ${IMPORTKEY_EMAIL ? `✅ 설정됨 (${IMPORTKEY_EMAIL.substring(0, 3)}***)` : "❌ 없음"}`);
console.log(`   IMPORTKEY_PASSWORD: ${IMPORTKEY_PASSWORD ? "✅ 설정됨 (***)" : "❌ 없음"}`);

// 원본 값 확인 (디버깅용)
if (!IMPORTKEY_EMAIL || !IMPORTKEY_PASSWORD) {
  console.log("\n🔍 디버깅 정보:");
  console.log(`   process.env.IMPORTKEY_EMAIL (원본): "${process.env.IMPORTKEY_EMAIL}"`);
  console.log(`   process.env.IMPORTKEY_PASSWORD (원본): "${process.env.IMPORTKEY_PASSWORD ? "***" : "undefined"}"`);
  console.log(`   envResult.parsed?.IMPORTKEY_EMAIL: "${envResult.parsed?.IMPORTKEY_EMAIL}"`);
  console.log(`   envResult.parsed?.IMPORTKEY_PASSWORD: "${envResult.parsed?.IMPORTKEY_PASSWORD ? "***" : "undefined"}"`);
}

if (!IMPORTKEY_EMAIL || !IMPORTKEY_PASSWORD) {
  console.error("\n❌ 환경 변수가 설정되지 않았습니다.");
  console.error("\n💡 해결 방법:");
  console.error(`   1. 프로젝트 루트에 .env.local 파일을 생성하세요: ${path.resolve(process.cwd(), ".env.local")}`);
  console.error("   2. 다음 내용을 추가하세요:");
  console.error("      IMPORTKEY_EMAIL=your-email@example.com");
  console.error("      IMPORTKEY_PASSWORD=your-password");
  console.error("\n   ⚠️  주의:");
  console.error("      - 등호(=) 앞뒤에 공백이 없어야 합니다");
  console.error("      - 따옴표는 필요 없습니다");
  console.error("      - 주석은 #으로 시작합니다");
  process.exit(1);
}

// 다운로드 디렉토리 설정
const DOWNLOAD_DIR = path.resolve(process.cwd(), "downloads");
if (!fs.existsSync(DOWNLOAD_DIR)) {
  fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });
}

/**
 * 브라우저 인스턴스 생성
 */
async function createBrowser(): Promise<Browser> {
  console.log("🌐 브라우저 시작 중...");
  
  const browser = await puppeteer.launch({
    headless: false, // 브라우저가 보이도록 설정
    defaultViewport: null,
    args: [
      "--start-maximized", // 창 최대화
      `--download.default_directory=${DOWNLOAD_DIR}`, // 다운로드 경로 설정
      "--disable-blink-features=AutomationControlled", // 자동화 감지 방지
    ],
  });

  return browser;
}

/**
 * ImportKey.com에 로그인
 */
async function login(page: Page): Promise<boolean> {
  try {
    console.log("🔐 로그인 페이지로 이동 중...");
    await page.goto("https://importkey.com/login", {
      waitUntil: "networkidle2",
      timeout: 30000,
    });

    // 이메일 입력
    console.log("📧 이메일 입력 중...");
    await page.waitForSelector('input[type="email"], input[name="email"], input[id="email"]', {
      timeout: 10000,
    });
    
    // 여러 가능한 셀렉터 시도
    const emailSelectors = [
      'input[type="email"]',
      'input[name="email"]',
      'input[id="email"]',
      'input[placeholder*="email" i]',
    ];
    
    let emailInput = null;
    for (const selector of emailSelectors) {
      try {
        emailInput = await page.$(selector);
        if (emailInput) break;
      } catch (e) {
        // 다음 셀렉터 시도
      }
    }

    if (!emailInput) {
      throw new Error("이메일 입력 필드를 찾을 수 없습니다.");
    }

    await emailInput.type(IMPORTKEY_EMAIL, { delay: 1 });

    // 비밀번호 입력
    console.log("🔑 비밀번호 입력 중...");
    const passwordSelectors = [
      'input[type="password"]',
      'input[name="password"]',
      'input[id="password"]',
    ];

    let passwordInput = null;
    for (const selector of passwordSelectors) {
      try {
        passwordInput = await page.$(selector);
        if (passwordInput) break;
      } catch (e) {
        // 다음 셀렉터 시도
      }
    }

    if (!passwordInput) {
      throw new Error("비밀번호 입력 필드를 찾을 수 없습니다.");
    }

    await passwordInput.type(IMPORTKEY_PASSWORD, { delay: 100 });

    // 로그인 버튼 클릭
    console.log("🚀 로그인 버튼 클릭 중...");
    const loginButtonSelectors = [
      'button[type="submit"]',
      'button:has-text("Login")',
      'button:has-text("Sign in")',
      'input[type="submit"]',
      'a[href*="login"]',
    ];

    let loginButton = null;
    for (const selector of loginButtonSelectors) {
      try {
        loginButton = await page.$(selector);
        if (loginButton) break;
      } catch (e) {
        // 다음 셀렉터 시도
      }
    }

    if (!loginButton) {
      // Enter 키로 시도
      await passwordInput.press("Enter");
    } else {
      await loginButton.click();
    }

    // 로그인 완료 대기 (URL 변경 또는 특정 요소 대기)
    console.log("⏳ 로그인 완료 대기 중...");
    
    try {
      // 네비게이션 대기 (최대 30초)
      await Promise.race([
        page.waitForNavigation({
          waitUntil: "networkidle2",
          timeout: 30000,
        }),
        new Promise((resolve) => setTimeout(resolve, 5000)), // 최소 5초 대기
      ]);
    } catch (navError) {
      // 네비게이션이 발생하지 않아도 계속 진행
      console.log("   ⚠️  네비게이션 대기 중 타임아웃 (계속 진행)");
    }

    // 추가 대기 (JavaScript 실행 시간 확보)
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // 로그인 성공 확인
    const currentUrl = page.url();
    console.log(`   📄 현재 URL: ${currentUrl}`);

    // 여러 방법으로 로그인 성공 확인
    const isLoginPage = currentUrl.includes("/login");
    const hasError = await page.evaluate(() => {
      // 에러 메시지가 있는지 확인
      const errorText = document.body.innerText.toLowerCase();
      return errorText.includes("invalid") || 
             errorText.includes("incorrect") || 
             errorText.includes("error") ||
             errorText.includes("실패");
    });

    if (hasError) {
      // 스크린샷 저장
      const screenshotPath = path.join(DOWNLOAD_DIR, "login-error.png");
      await page.screenshot({ path: screenshotPath, fullPage: true });
      console.log(`   📸 에러 스크린샷 저장: ${screenshotPath}`);
      throw new Error("로그인 에러 메시지가 감지되었습니다.");
    }

    if (isLoginPage) {
      // 스크린샷 저장
      const screenshotPath = path.join(DOWNLOAD_DIR, "login-still-on-page.png");
      await page.screenshot({ path: screenshotPath, fullPage: true });
      console.log(`   📸 현재 페이지 스크린샷 저장: ${screenshotPath}`);
      console.log("   ⚠️  여전히 로그인 페이지에 있습니다.");
      console.log("   💡 수동으로 로그인을 확인해주세요.");
      
      // 사용자에게 수동 확인 기회 제공
      console.log("   ⏸️  10초 대기 중... (수동으로 로그인 완료하세요)");
      await new Promise((resolve) => setTimeout(resolve, 10000));
      
      // 다시 URL 확인
      const newUrl = page.url();
      if (newUrl.includes("/login")) {
        throw new Error("로그인에 실패했습니다. URL이 변경되지 않았습니다.");
      }
    }

    console.log("✅ 로그인 성공!");
    return true;
  } catch (error) {
    console.error("❌ 로그인 실패:", error);
    return false;
  }
}

/**
 * 키워드로 검색하고 CSV 다운로드
 */
/**
 * 키워드를 URL-safe 형식으로 변환
 * 예: "Glass Pipe" -> "glass-pipe"
 */
function normalizeKeyword(keyword: string): string {
  return keyword
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // 특수문자 제거 (하이픈 제외)
    .replace(/\s+/g, '-') // 공백을 하이픈으로
    .replace(/-+/g, '-') // 연속된 하이픈을 하나로
    .replace(/^-|-$/g, ''); // 앞뒤 하이픈 제거
}

async function harvestKeyword(
  page: Page,
  keyword: string,
  index: number
): Promise<boolean> {
  try {
    console.log(`\n📦 [${index + 1}/${KEYWORDS.length}] 키워드 처리 중: "${keyword}"`);

    // 키워드 정규화 (URL-safe 형식으로 변환)
    const normalizedKeyword = normalizeKeyword(keyword);
    console.log(`   🔤 정규화된 키워드: "${normalizedKeyword}"`);

    // ImportKey의 실제 검색 URL 형식: /result/shipment/{keyword}?domain=usimport
    const searchUrl = `https://importkey.com/result/shipment/${normalizedKeyword}?domain=usimport`;
    
    console.log(`   🔍 검색 페이지로 이동: ${searchUrl}`);
    
    // Rocket Loader가 완료될 때까지 충분히 대기
    await page.goto(searchUrl, {
      waitUntil: "domcontentloaded", // networkidle2 대신 domcontentloaded 사용
      timeout: 60000, // 타임아웃 증가
    });

    // Rocket Loader 및 JavaScript 완전 로드 대기
    console.log("   ⏳ Rocket Loader 및 JavaScript 로드 대기 중...");
    
    try {
      // Rocket Loader가 완료될 때까지 대기 (최대 15초)
      await page.waitForFunction(
        () => {
          // document.readyState가 complete이고, 주요 스크립트가 로드되었는지 확인
          return document.readyState === "complete" && 
                 typeof window !== "undefined" &&
                 !document.querySelector('script[data-cfasync="false"]:not([src*="rocket"])');
        },
        { timeout: 15000 }
      ).catch(() => {
        // Rocket Loader 확인 실패해도 계속 진행
        console.log("   ⚠️  Rocket Loader 확인 스킵 (계속 진행)");
      });
    } catch (e) {
      // 무시하고 계속 진행
    }

    // 추가 대기 (동적 콘텐츠 로드 시간 확보)
    console.log("   ⏳ 동적 콘텐츠 로드 대기 중...");
    await new Promise((resolve) => setTimeout(resolve, 5000));
    
    // 네트워크 요청이 완료될 때까지 추가 대기
    try {
      // networkidle2 상태로 추가 네비게이션 대기 (Rocket Loader 완료 확인)
      await page.waitForNavigation({ waitUntil: "networkidle2", timeout: 10000 }).catch(() => {
        // 네비게이션이 없어도 계속 진행 (이미 로드된 페이지)
      });
    } catch (e) {
      // 무시하고 계속 진행
    }
    
    // 최종 안정화 대기
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // [날짜 범위 확장] '5 years' 버튼 클릭 시도
    console.log("   📅 날짜 범위 확장 시도 중...");
    try {
      // 여러 방법으로 '5 years' 버튼 찾기
      const dateRangeSelectors = [
        // XPath로 텍스트 기반 검색
        "//span[contains(translate(text(), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), '5 years')]",
        "//span[contains(translate(text(), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), '5+ years')]",
        "//button[contains(translate(text(), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), '5 years')]",
        "//a[contains(translate(text(), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), '5 years')]",
        // CSS 셀렉터
        'button:has-text("5 years")',
        'button:has-text("5+ years")',
        'span:has-text("5 years")',
        'a:has-text("5 years")',
        '[data-value*="5"]',
        '[aria-label*="5 years" i]',
      ];

      let dateButton = null;
      for (const selector of dateRangeSelectors) {
        try {
          if (selector.startsWith('//')) {
            // XPath
            const elements = await (page as any).$x(selector);
            if (elements && elements.length > 0) {
              dateButton = elements[0];
              console.log(`   ✅ 날짜 범위 버튼 발견 (XPath): ${selector}`);
              break;
            }
          } else {
            // CSS 셀렉터
            const element = await page.$(selector);
            if (element) {
              dateButton = element;
              console.log(`   ✅ 날짜 범위 버튼 발견 (CSS): ${selector}`);
              break;
            }
          }
        } catch (e) {
          // 다음 셀렉터 시도
        }
      }

      if (dateButton) {
        // 버튼이 보이도록 스크롤
        await dateButton.evaluate((el: HTMLElement) => {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        });
        await new Promise((resolve) => setTimeout(resolve, 500));

        // 클릭 시도
        try {
          await (dateButton as any).click({ delay: 100 });
          console.log("   ✅ 날짜 범위 확장 완료 (5 years)");
          
          // 데이터 갱신 대기
          await new Promise((resolve) => setTimeout(resolve, 3000));
          
          // 네트워크 요청 완료 대기
          try {
            await page.waitForNavigation({ waitUntil: "networkidle2", timeout: 10000 }).catch(() => {});
          } catch (e) {
            // 무시
          }
        } catch (clickError) {
          // JavaScript 클릭 시도
          try {
            await dateButton.evaluate((el: any) => el.click());
            console.log("   ✅ 날짜 범위 확장 완료 (JavaScript 클릭)");
            await new Promise((resolve) => setTimeout(resolve, 3000));
          } catch (jsError) {
            console.log(`   ⚠️  날짜 범위 버튼 클릭 실패: ${jsError}`);
          }
        }
      } else {
        console.log("   ⚠️  날짜 범위 버튼을 찾을 수 없습니다 (기본 설정 사용)");
      }
    } catch (e) {
      console.log(`   ⚠️  날짜 범위 변경 실패 (무시하고 진행): ${e}`);
    }

    // Export 버튼 찾기 (간단하고 직접적인 방법)
    console.log("   🔍 Export 버튼 검색 중...");

    // 다운로드 시작 전 파일 목록 확인
    const filesBefore = fs.readdirSync(DOWNLOAD_DIR);

    let exportButton = null;

    // 방법 1: 가장 간단한 방법 - 정확히 "Export" 텍스트만 가진 버튼 찾기
    try {
      // 모든 버튼을 찾아서 정확히 "Export"만 가진 것 찾기
      const allButtons = await page.$$('button');
      for (const btn of allButtons) {
        const text = await btn.evaluate((el: Element) => el.textContent?.trim() || '');
        // 정확히 "Export"만 있거나, "Export"만 포함하고 다른 단어가 없는 경우
        if (text.toLowerCase() === 'export' || (text.toLowerCase().includes('export') && text.length < 20)) {
          // 탭 버튼 제외: "Data", "US", "Global", "Mexico" 같은 단어가 없어야 함
          const isTab = /data|us|global|mexico|import|export data/i.test(text);
          if (!isTab) {
            exportButton = btn;
            console.log(`   ✅ Export 버튼 발견: "${text}"`);
            break;
          }
        }
      }
    } catch (e) {
      console.log(`   ⚠️  버튼 검색 실패: ${e}`);
    }

    // 방법 2: XPath로 정확히 "Export"만 찾기
    if (!exportButton) {
      try {
        const buttons = await (page as any).$x('//button[normalize-space(text())="Export"]');
        if (buttons && buttons.length > 0) {
          // 탭이 아닌지 확인
          for (const btn of buttons) {
            const text = await btn.evaluate((el: Element) => el.textContent?.trim() || '');
            const isTab = /data|us|global|mexico|import|export data/i.test(text);
            if (!isTab) {
              exportButton = btn;
              console.log(`   ✅ Export 버튼 발견 (XPath): "${text}"`);
              break;
            }
          }
        }
      } catch (e) {
        console.log(`   ⚠️  XPath 검색 실패: ${e}`);
      }
    }

    // 방법 3: 페이지 전체에서 "Export" 텍스트를 가진 모든 요소 찾기
    if (!exportButton) {
      try {
        const exportElements = await page.evaluate(() => {
          const allElements = Array.from(document.querySelectorAll('button, a, div, span'));
          return allElements
            .map((el, index) => {
              const text = el.textContent?.trim() || '';
              const isExport = text.toLowerCase() === 'export' || 
                             (text.toLowerCase().includes('export') && text.length < 20);
              const isTab = /data|us|global|mexico|import|export data/i.test(text);
              const style = window.getComputedStyle(el);
              const isVisible = style.display !== 'none' && style.visibility !== 'hidden';
              
              if (isExport && !isTab && isVisible) {
                return { index, text, tagName: el.tagName };
              }
              return null;
            })
            .filter(el => el !== null);
        });

        if (exportElements && exportElements.length > 0) {
          console.log(`   📋 Export 버튼 후보 ${exportElements.length}개 발견:`);
          exportElements.forEach((el: any, i: number) => {
            console.log(`      ${i + 1}. "${el.text}" (${el.tagName})`);
          });

          // 첫 번째 요소 선택
          const firstElement = exportElements[0];
          const allElements = await page.$$('button, a, div, span');
          if (allElements[firstElement.index]) {
            exportButton = allElements[firstElement.index];
            console.log(`   ✅ Export 버튼 선택: "${firstElement.text}"`);
          }
        }
      } catch (e) {
        console.log(`   ⚠️  전체 검색 실패: ${e}`);
      }
    }

    if (!exportButton) {
      console.log(`   ❌ 실패: Export 버튼을 찾을 수 없습니다. (스크린샷 저장)`);
      const screenshotPath = path.join(DOWNLOAD_DIR, `error-${keyword.replace(/\s+/g, "-")}.png`);
      await page.screenshot({ path: screenshotPath, fullPage: true });
      console.log(`   📸 스크린샷 저장: ${screenshotPath}`);
      return false;
    }

    // 🎯 시각적 디버깅: 찾은 버튼에 빨간 테두리 표시
    try {
      await page.evaluate((el: HTMLElement) => {
        el.style.border = "5px solid red";
        el.style.backgroundColor = "yellow";
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }, exportButton as any);
      console.log("   🎯 타겟 버튼에 빨간 테두리를 표시했습니다. 1초 후 클릭합니다.");
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (e) {
      console.log(`   ⚠️  시각적 표시 실패 (계속 진행): ${e}`);
    }

    // Export 버튼 클릭
    try {
      await (exportButton as any).click({ delay: 100 });
      console.log("   🖱️ Export 버튼 클릭 성공!");
    } catch (clickError) {
      console.log(`   ⚠️  일반 클릭 실패, JavaScript 클릭 시도...`);
      try {
        await exportButton.evaluate((el: any) => el.click());
        console.log("   🖱️ Export 버튼 클릭 성공 (JavaScript)");
      } catch (jsError) {
        console.error(`   ❌ Export 버튼 클릭 실패: ${jsError}`);
        return false;
      }
    }

    // 모달 팝업 대기
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Export 모달에서 설정 및 Download 버튼 클릭
    try {
      // 모달이 나타났는지 확인
      const modalSelectors = [
        'div[class*="modal" i]',
        'div[class*="dialog" i]',
        '[role="dialog"]',
        'div:has-text("Export As")',
        'div:has-text("Export as")',
      ];

      let modal = null;
      for (const selector of modalSelectors) {
        try {
          modal = await page.$(selector);
          if (modal) {
            console.log(`   ✅ Export 모달 발견: ${selector}`);
            break;
          }
        } catch (e) {
          // 다음 셀렉터 시도
        }
      }

      if (!modal) {
        // XPath로 "Export As" 텍스트가 있는 모달 찾기
        try {
          const modals = await (page as any).$x('//div[contains(translate(text(), "EXPORT AS", "export as"), "export as")]');
          if (modals && modals.length > 0) {
            modal = modals[0];
            console.log("   ✅ Export 모달 발견 (XPath)");
          }
        } catch (e) {
          // 무시
        }
      }

      if (modal) {
        console.log("   ⚙️  Export 모달 설정 중...");

        // Rows Range를 300으로 설정
        console.log("   🔢 Rows Range 'to' 필드에 300 입력 중...");
        try {
          // 방법 1: "to" 라벨 옆의 입력 필드 찾기 (XPath)
          let toInput = null;
          try {
            const inputs = await (page as any).$x('//label[contains(text(), "to") or contains(text(), "To")]/following-sibling::input | //input[preceding-sibling::label[contains(text(), "to") or contains(text(), "To")]] | //input[following-sibling::label[contains(text(), "to") or contains(text(), "To")]]');
            if (inputs && inputs.length > 0) {
              // "to" 필드는 보통 두 번째 입력 필드
              toInput = inputs[inputs.length - 1];
              console.log("   ✅ 'to' 입력 필드 발견 (XPath)");
            }
          } catch (e) {
            // 다음 방법 시도
          }

          // 방법 2: 모든 입력 필드 중에서 "to" 필드 찾기
          if (!toInput) {
            try {
              const allInputs = await page.$$('input[type="text"], input[type="number"]');
              if (allInputs.length >= 2) {
                // "From"과 "to" 필드가 있으므로 두 번째가 "to" 필드
                toInput = allInputs[allInputs.length - 1];
                console.log("   ✅ 'to' 입력 필드 발견 (두 번째 입력 필드)");
              }
            } catch (e) {
              // 다음 방법 시도
            }
          }

          // 방법 3: value가 "300"인 입력 필드 찾기 (이미 300이 설정되어 있을 수 있음)
          if (!toInput) {
            try {
              const inputs = await page.$$('input[value="300"]');
              if (inputs.length > 0) {
                toInput = inputs[0];
                console.log("   ✅ 'to' 입력 필드 발견 (value=300)");
              }
            } catch (e) {
              // 다음 방법 시도
            }
          }

          if (toInput) {
            // 기존 값 지우고 300 입력
            await toInput.click({ clickCount: 3 }); // 전체 선택
            await new Promise((resolve) => setTimeout(resolve, 200));
            await toInput.type('300', { delay: 50 });
            await new Promise((resolve) => setTimeout(resolve, 30));
            console.log("   ✅ Rows Range 'to' 필드에 300 입력 완료");
          } else {
            // 방법 4: 빠른 선택 버튼 "300" 클릭 시도
            console.log("   🔍 빠른 선택 버튼 '300' 검색 중...");
            try {
              // 모달 내부의 모든 클릭 가능한 요소 찾기
              const clickableElements = await modal.$$eval('button, a, span, div', (elements: Element[]) => {
                return elements
                  .map((el: Element, index: number) => ({
                    index,
                    text: el.textContent?.trim() || '',
                    tagName: el.tagName.toLowerCase(),
                  }))
                  .filter((el: { index: number; text: string; tagName: string }) => el.text === '1' && (el.tagName === 'button' || el.tagName === 'a' || el.tagName === 'span' || el.tagName === 'div'));
              });

              if (clickableElements.length > 0) {
                const elementIndex = clickableElements[0].index;
                const allElements = await modal.$$('button, a, span, div');
                if (allElements[elementIndex]) {
                  await allElements[elementIndex].click();
                  console.log("   ✅ 빠른 선택 버튼 '300' 클릭 완료");
                  await new Promise((resolve) => setTimeout(resolve, 500));
                }
              } else {
                console.log("   ⚠️  'to' 입력 필드와 빠른 선택 버튼을 찾을 수 없습니다 (기본값 사용)");
              }
            } catch (e) {
              console.log(`   ⚠️  빠른 선택 버튼 클릭 실패: ${e}`);
            }
          }
        } catch (e) {
          console.log(`   ⚠️  Rows Range 설정 시도 실패 (계속 진행): ${e}`);
        }

        // Download 버튼 찾기 및 클릭 (간단하고 직접적인 방법)
        console.log("   🔍 Download 버튼 검색 중...");
        
        let downloadButton = null;

        // 방법 1: 페이지의 모든 button 요소에서 정확히 "Download" 텍스트 찾기
        try {
          const allButtons = await page.$$('button');
          console.log(`   📋 페이지에 ${allButtons.length}개의 button 요소 발견`);
          
          for (const btn of allButtons) {
            const text = await btn.evaluate((el: Element) => el.textContent?.trim() || '');
            
            // 정확히 "Download"만 있거나, "Download"만 포함하고 짧은 텍스트
            if (text.toLowerCase() === 'download' || (text.toLowerCase().includes('download') && text.length < 300)) {
              // 버튼이 보이는지 확인
              const isVisible = await btn.evaluate((el: Element) => {
                const style = window.getComputedStyle(el as HTMLElement);
                return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
              });
              
              if (isVisible) {
                downloadButton = btn;
                console.log(`   ✅ Download 버튼 발견: "${text}"`);
                break;
              }
            }
          }
        } catch (e) {
          console.log(`   ⚠️  버튼 검색 실패: ${e}`);
        }

        // 방법 2: 모달 내부에서 찾기 (모달이 있을 경우)
        if (!downloadButton && modal) {
          try {
            const modalButtons = await modal.$$('button');
            console.log(`   📋 모달 내부에 ${modalButtons.length}개의 button 요소 발견`);
            
            for (const btn of modalButtons) {
              const text = await btn.evaluate((el: Element) => el.textContent?.trim() || '');
              if (text.toLowerCase() === 'download' || text.toLowerCase().includes('download')) {
                downloadButton = btn;
                console.log(`   ✅ Download 버튼 발견 (모달 내부): "${text}"`);
                break;
              }
            }
          } catch (e) {
            console.log(`   ⚠️  모달 내부 버튼 검색 실패: ${e}`);
          }
        }

        // 방법 3: XPath로 정확히 "Download"만 찾기
        if (!downloadButton) {
          try {
            const buttons = await (page as any).$x('//button[normalize-space(translate(text(), "DOWNLOAD", "download"))="download"]');
            if (buttons && buttons.length > 0) {
              console.log(`   📋 XPath로 ${buttons.length}개의 Download 버튼 발견`);
              
              // 보이는 버튼 찾기
              for (const btn of buttons) {
                const isVisible = await btn.evaluate((el: Element) => {
                  const style = window.getComputedStyle(el as HTMLElement);
                  return style.display !== 'none' && style.visibility !== 'hidden';
                });
                
                if (isVisible) {
                  downloadButton = btn;
                  console.log("   ✅ Download 버튼 발견 (XPath)");
                  break;
                }
              }
            }
          } catch (e) {
            console.log(`   ⚠️  XPath 검색 실패: ${e}`);
          }
        }

        // 방법 4: 페이지 전체 스캔 (모든 클릭 가능한 요소)
        if (!downloadButton) {
          try {
            const downloadElements = await page.evaluate(() => {
              const allElements = Array.from(document.querySelectorAll('button, a, div[role="button"], span[role="button"]'));
              return allElements
                .map((el, index) => {
                  const text = el.textContent?.trim() || '';
                  const isDownload = text.toLowerCase() === 'download';
                  const style = window.getComputedStyle(el);
                  const isVisible = style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
                  
                  if (isDownload && isVisible) {
                    return { index, text, tagName: el.tagName };
                  }
                  return null;
                })
                .filter(el => el !== null);
            });

            if (downloadElements && downloadElements.length > 0) {
              console.log(`   📋 Download 버튼 후보 ${downloadElements.length}개 발견:`);
              downloadElements.forEach((el: any, i: number) => {
                console.log(`      ${i + 1}. "${el.text}" (${el.tagName})`);
              });

              const firstElement = downloadElements[0];
              const allElements = await page.$$('button, a, div[role="button"], span[role="button"]');
              if (allElements[firstElement.index]) {
                downloadButton = allElements[firstElement.index];
                console.log(`   ✅ Download 버튼 선택: "${firstElement.text}"`);
              }
            }
          } catch (e) {
            console.log(`   ⚠️  전체 스캔 실패: ${e}`);
          }
        }

        if (downloadButton) {
          // 🎯 시각적 디버깅: Download 버튼에 빨간 테두리 표시
          try {
            await page.evaluate((el: HTMLElement) => {
              el.style.border = "5px solid red";
              el.style.backgroundColor = "yellow";
              el.scrollIntoView({ behavior: "smooth", block: "center" });
            }, downloadButton as any);
            console.log("   🎯 Download 버튼에 빨간 테두리를 표시했습니다. 1초 후 클릭합니다.");
            await new Promise((resolve) => setTimeout(resolve, 1000));
          } catch (e) {
            console.log(`   ⚠️  시각적 표시 실패 (계속 진행): ${e}`);
          }

          // Download 버튼 클릭
          try {
            await (downloadButton as any).click({ delay: 100 });
            console.log("   ✅ Download 버튼 클릭 완료");
          } catch (clickError) {
            console.log(`   ⚠️  일반 클릭 실패, JavaScript 클릭 시도...`);
            try {
              await downloadButton.evaluate((el: any) => el.click());
              console.log("   ✅ Download 버튼 클릭 완료 (JavaScript)");
            } catch (jsError) {
              console.error(`   ❌ Download 버튼 클릭 실패: ${jsError}`);
              return false;
            }
          }

          // 모달이 닫힐 때까지 대기
          await new Promise((resolve) => setTimeout(resolve, 1000));
        } else {
          console.log("   ⚠️  Download 버튼을 찾을 수 없습니다");
          console.log("   📸 모달 스크린샷 저장 중...");
          const modalScreenshot = path.join(DOWNLOAD_DIR, `modal-${keyword.replace(/\s+/g, "-")}.png`);
          await page.screenshot({ path: modalScreenshot, fullPage: true });
          console.log(`   📸 스크린샷 저장: ${modalScreenshot}`);
          
          // 모달 닫기 시도
          try {
            const closeButton = await page.$('button[aria-label*="close" i], button:has-text("×"), button:has-text("✕")');
            if (closeButton) {
              await closeButton.click();
            }
          } catch (e) {
            // 무시
          }
          return false;
        }
      } else {
        console.log("   ⚠️  Export 모달을 찾을 수 없습니다 (직접 다운로드 시도)");
      }
    } catch (modalError) {
      console.log(`   ⚠️  Export 모달 처리 중 오류 (계속 진행): ${modalError}`);
    }

    // 다운로드 완료 대기
    console.log("   ⏳ 다운로드 완료 대기 중...");
    await new Promise((resolve) => setTimeout(resolve, 8000)); // 다운로드 시간 확보

    // 다운로드된 파일 확인
    const filesAfter = fs.readdirSync(DOWNLOAD_DIR);
    const newFiles = filesAfter.filter((file) => !filesBefore.includes(file));

    if (newFiles.length > 0) {
      console.log(`   ✅ 다운로드 완료: ${newFiles.join(", ")}`);
      return true;
    } else {
      console.log(`   ⚠️  새 파일이 다운로드되지 않았습니다.`);
      return false;
    }
  } catch (error) {
    console.error(`   ❌ 키워드 "${keyword}" 처리 중 오류:`, error);
    return false;
  }
}

/**
 * 메인 실행 함수
 */
async function main() {
  console.log("🚀 ImportKey Harvester 시작\n");
  console.log(`📋 처리할 키워드: ${KEYWORDS.length}개`);
  console.log(`📁 다운로드 경로: ${DOWNLOAD_DIR}\n`);

  let browser: Browser | null = null;

  try {
    // 브라우저 생성
    browser = await createBrowser();
    const page = await browser.newPage();

    // 수동 로그인 모드: ImportKey.com으로 이동하고 사용자가 직접 로그인할 시간 제공
    console.log("🔐 수동 로그인 모드");
    console.log("   브라우저가 열리면 직접 로그인을 완료해주세요.");
    console.log("   로그인 완료 후 이 터미널로 돌아와서 아무 키나 누르세요...");
    
    await page.goto("https://importkey.com/login", {
      waitUntil: "networkidle2",
      timeout: 30000,
    });

    // 사용자가 로그인할 시간 제공 (최대 5분)
    console.log("\n⏳ 로그인 완료를 기다리는 중... (최대 5분)");
    console.log("   로그인 후 브라우저에서 대시보드나 검색 페이지로 이동하세요.");
    
    // URL이 /login에서 변경될 때까지 대기
    let waitTime = 0;
    const maxWaitTime = 300000; // 5분
    const checkInterval = 2000; // 2초마다 확인
    
    while (waitTime < maxWaitTime) {
      await new Promise((resolve) => setTimeout(resolve, checkInterval));
      waitTime += checkInterval;
      
      const currentUrl = page.url();
      if (!currentUrl.includes("/login")) {
        console.log(`\n✅ 로그인 완료 감지! (${Math.round(waitTime / 1000)}초 소요)`);
        console.log(`   현재 URL: ${currentUrl}`);
        break;
      }
      
      // 10초마다 진행 상황 표시
      if (waitTime % 10000 === 0) {
        console.log(`   ⏳ 대기 중... (${Math.round(waitTime / 1000)}초 경과)`);
      }
    }

    // 여전히 로그인 페이지에 있으면 경고
    const finalUrl = page.url();
    if (finalUrl.includes("/login")) {
      console.log("\n⚠️  경고: 여전히 로그인 페이지에 있습니다.");
      console.log("   계속 진행하시겠습니까? (Y/N)");
      console.log("   자동으로 계속 진행합니다...");
    } else {
      console.log("✅ 로그인 확인 완료!");
    }

    // 키워드 순회 처리
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < KEYWORDS.length; i++) {
      const keyword = KEYWORDS[i];
      const success = await harvestKeyword(page, keyword, i);
      
      if (success) {
        successCount++;
      } else {
        failCount++;
      }

      // 다음 키워드 처리 전 잠시 대기 (서버 부하 방지)
      if (i < KEYWORDS.length - 1) {
        console.log("   ⏸️  다음 키워드 처리 전 대기 중...");
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }

    // 결과 요약
    console.log("\n" + "=".repeat(50));
    console.log("📊 수확 완료!");
    console.log(`   ✅ 성공: ${successCount}개`);
    console.log(`   ❌ 실패: ${failCount}개`);
    console.log(`   📁 다운로드 경로: ${DOWNLOAD_DIR}`);
    console.log("=".repeat(50));

  } catch (error) {
    console.error("\n❌ 치명적 오류 발생:", error);
    process.exit(1);
  } finally {
    // 브라우저 종료
    if (browser) {
      console.log("\n🔒 브라우저 종료 중...");
      await browser.close();
    }
  }
}

// 스크립트 실행
if (require.main === module) {
  main().catch((error) => {
    console.error("❌ 예상치 못한 오류:", error);
    process.exit(1);
  });
}

export { main };

