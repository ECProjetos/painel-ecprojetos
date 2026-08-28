import type { jsPDF } from "jspdf"

export type PdfRgb = readonly [
  number,
  number,
  number,
]

export const EC_PDF_COLORS = {
  navy: [7, 48, 103] as PdfRgb,
  blue: [22, 94, 170] as PdfRgb,
  mediumBlue: [51, 111, 180] as PdfRgb,
  lightBlue: [120, 164, 207] as PdfRgb,

  text: [24, 32, 44] as PdfRgb,
  muted: [93, 108, 127] as PdfRgb,

  border: [220, 226, 233] as PdfRgb,
  lightBackground: [246, 248, 251] as PdfRgb,
  white: [255, 255, 255] as PdfRgb,
}

const imageCache = new Map<string, string | null>()

function setFillColor(
  pdf: jsPDF,
  color: PdfRgb,
) {
  pdf.setFillColor(
    color[0],
    color[1],
    color[2],
  )
}

function setTextColor(
  pdf: jsPDF,
  color: PdfRgb,
) {
  pdf.setTextColor(
    color[0],
    color[1],
    color[2],
  )
}

function setDrawColor(
  pdf: jsPDF,
  color: PdfRgb,
) {
  pdf.setDrawColor(
    color[0],
    color[1],
    color[2],
  )
}

export async function loadPdfImage(
  src: string,
): Promise<string | null> {
  if (imageCache.has(src)) {
    return imageCache.get(src) ?? null
  }

  try {
    const response = await fetch(src, {
      cache: "force-cache",
    })

    if (!response.ok) {
      imageCache.set(src, null)
      return null
    }

    const blob = await response.blob()

    const dataUrl =
      await new Promise<string>(
        (resolve, reject) => {
          const reader = new FileReader()

          reader.onload = () => {
            resolve(String(reader.result))
          }

          reader.onerror = () => {
            reject(reader.error)
          }

          reader.readAsDataURL(blob)
        },
      )

    imageCache.set(src, dataUrl)

    return dataUrl
  } catch {
    imageCache.set(src, null)
    return null
  }
}

/**
 * Marca EC Projetos.
 *
 * O PNG atual possui somente o símbolo "EC".
 * A palavra "projetos" é escrita vetorialmente ao lado,
 * evitando distorcer a imagem.
 */
export function drawEcWordmark(
  pdf: jsPDF,
  logo: string | null,
  x = 15,
  y = 5.5,
  compact = false,
) {
  const logoWidth =
    compact ? 11 : 13

  const logoHeight =
    compact ? 8.8 : 10.3

  if (logo) {
    pdf.addImage(
      logo,
      "PNG",
      x,
      y,
      logoWidth,
      logoHeight,
      undefined,
      "FAST",
    )

    pdf.setFont(
      "helvetica",
      "normal",
    )

    pdf.setFontSize(
      compact ? 10.5 : 12.5,
    )

    setTextColor(
      pdf,
      EC_PDF_COLORS.text,
    )

    pdf.text(
      "projetos",
      x + logoWidth + 1,
      y +
        (compact ? 6.3 : 7.4),
    )

    return
  }

  // Fallback caso a imagem não seja carregada
  pdf.setFont(
    "helvetica",
    "bold",
  )

  pdf.setFontSize(
    compact ? 10.5 : 12.5,
  )

  setTextColor(
    pdf,
    EC_PDF_COLORS.navy,
  )

  pdf.text(
    "EC Projetos",
    x,
    y +
      (compact ? 6.3 : 7.4),
  )
}

/**
 * Grafismo azul institucional.
 */
export function drawEcStripes(
  pdf: jsPDF,
  startX = 111,
  y = 5.5,
  height = 9,
) {
  const pageWidth =
    pdf.internal.pageSize.getWidth()

  const barWidth = 12
  const skew = 4

  const bars: PdfRgb[] = [
    EC_PDF_COLORS.navy,
    EC_PDF_COLORS.blue,
    EC_PDF_COLORS.mediumBlue,
  ]

  let x = startX

  for (const color of bars) {
    setFillColor(pdf, color)

    pdf.lines(
      [
        [barWidth, 0],
        [-skew, height],
        [-barWidth, 0],
        [skew, -height],
      ],
      x,
      y,
      [1, 1],
      "F",
      true,
    )

    x += 10.5
  }

  setFillColor(
    pdf,
    EC_PDF_COLORS.lightBlue,
  )

  pdf.rect(
    x - 1,
    y,
    pageWidth - x + 1,
    height,
    "F",
  )
}

/**
 * Cabeçalho da primeira página do case.
 */
export function drawCommercialHeader(
  pdf: jsPDF,
  logo: string | null,
) {
  const pageWidth =
    pdf.internal.pageSize.getWidth()

  setFillColor(
    pdf,
    EC_PDF_COLORS.white,
  )

  pdf.rect(
    0,
    0,
    pageWidth,
    22,
    "F",
  )

  drawEcWordmark(
    pdf,
    logo,
    15,
    5.5,
    false,
  )

  drawEcStripes(
    pdf,
    111,
    5.5,
    9,
  )

  setDrawColor(
    pdf,
    EC_PDF_COLORS.border,
  )

  pdf.setLineWidth(0.25)

  pdf.line(
    15,
    20.5,
    pageWidth - 15,
    20.5,
  )

  return 23
}

/**
 * Cabeçalho das páginas seguintes.
 *
 * Mantém a mesma identidade visual da capa,
 * porém em proporção mais discreta.
 */
export function drawCommercialContinuationHeader(
  pdf: jsPDF,
  logo: string | null,
) {
  const pageWidth =
    pdf.internal.pageSize.getWidth()

  setFillColor(
    pdf,
    EC_PDF_COLORS.white,
  )

  pdf.rect(
    0,
    0,
    pageWidth,
    21,
    "F",
  )

  drawEcWordmark(
    pdf,
    logo,
    15,
    5.5,
    true,
  )

  drawEcStripes(
    pdf,
    119,
    6,
    7.5,
  )

  setDrawColor(
    pdf,
    EC_PDF_COLORS.border,
  )

  pdf.setLineWidth(0.25)

  pdf.line(
    15,
    19.5,
    pageWidth - 15,
    19.5,
  )

  return 24
}

/**
 * Rodapé comercial.
 */
export function drawCommercialFooter(
  pdf: jsPDF,
  pageNumber: number,
  totalPages: number,
) {
  const pageWidth =
    pdf.internal.pageSize.getWidth()

  const pageHeight =
    pdf.internal.pageSize.getHeight()

  const footerHeight = 9

  const footerY =
    pageHeight - footerHeight

  setFillColor(
    pdf,
    EC_PDF_COLORS.navy,
  )

  pdf.rect(
    0,
    footerY,
    pageWidth,
    footerHeight,
    "F",
  )

  // Grafismo discreto à direita
  setFillColor(
    pdf,
    EC_PDF_COLORS.blue,
  )

  pdf.lines(
    [
      [10, 0],
      [-4, footerHeight],
      [-10, 0],
      [4, -footerHeight],
    ],
    pageWidth - 34,
    footerY,
    [1, 1],
    "F",
    true,
  )

  setFillColor(
    pdf,
    EC_PDF_COLORS.mediumBlue,
  )

  pdf.lines(
    [
      [10, 0],
      [-4, footerHeight],
      [-10, 0],
      [4, -footerHeight],
    ],
    pageWidth - 25,
    footerY,
    [1, 1],
    "F",
    true,
  )

  setFillColor(
    pdf,
    EC_PDF_COLORS.lightBlue,
  )

  pdf.rect(
    pageWidth - 17,
    footerY,
    17,
    footerHeight,
    "F",
  )

  pdf.setFont(
    "helvetica",
    "normal",
  )

  pdf.setFontSize(6.8)

  setTextColor(
    pdf,
    EC_PDF_COLORS.white,
  )

  pdf.text(
    "EC Projetos - Portfólio de Projetos",
    15,
    footerY + 5.7,
  )

  pdf.text(
    `${pageNumber} / ${totalPages}`,
    pageWidth - 40,
    footerY + 5.7,
    {
      align: "right",
    },
  )
}

/**
 * Template técnico institucional.
 *
 * Será utilizado posteriormente nos relatórios internos.
 */
export function drawTechnicalTemplatePage(
  pdf: jsPDF,
  background: string | null,
) {
  if (!background) {
    return
  }

  const pageWidth =
    pdf.internal.pageSize.getWidth()

  const pageHeight =
    pdf.internal.pageSize.getHeight()

  pdf.addImage(
    background,
    "PNG",
    0,
    0,
    pageWidth,
    pageHeight,
    undefined,
    "FAST",
  )
}