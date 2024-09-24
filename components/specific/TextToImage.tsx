'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Download, Palette } from "lucide-react"

import { Noto_Sans_JP, Noto_Serif_JP, M_PLUS_Rounded_1c, Dela_Gothic_One } from "next/font/google"
const notoSansJP = Noto_Sans_JP({
  weight: ["400"],
  subsets: ["latin"],
})
const notoSerifJP = Noto_Serif_JP({
  weight: ["400"],
  subsets: ["latin"],
})
const mPlusRounded1c = M_PLUS_Rounded_1c({
  weight: ["400"],
  subsets: ["latin"],
})
const delaGothicOne = Dela_Gothic_One({
  weight: ["400"],
  subsets: ["latin"],
})

const fontOptions = [
  { value: `${notoSansJP.style.fontFamily}`, label: 'Noto Sans Japanese' },
  { value: `${notoSerifJP.style.fontFamily}`, label: 'Noto Serif Japanese' },
  { value: `${mPlusRounded1c.style.fontFamily}`, label: 'M PLUS Rounded 1c' },
  { value: `${delaGothicOne.style.fontFamily}`, label: 'Dela Gothic One' },
]

export default function TextToImage() {
  const [text, setText] = useState('')
  const [textColor, setTextColor] = useState('#000000')
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false)
  const [showOutline, setShowOutline] = useState(false)
  const [outlineColor, setOutlineColor] = useState('#000000')
  const [isOutlineColorPickerOpen, setIsOutlineColorPickerOpen] = useState(false)
  const [selectedFont, setSelectedFont] = useState('Hiragino Sans')
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const canvasSize = 128 // キャンバスのサイズを固定
  const borderColor = '#000000'

  const calculateOptimalFontSize = useCallback((ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxHeight: number) => {
    const lines = text.split('\n')
    const lineCount = lines.length
    const minLineHeight = 1.1 // 日本語テキストの行間を少し広げる

    const fontSize = Math.floor(( maxHeight / lineCount ) / minLineHeight)

    return fontSize
  }, [])

const drawTextInCanvas = useCallback((
    ctx: CanvasRenderingContext2D,
    text: string,
    fontSize: number,
    color: string,
    outline: boolean,
    outlineColor: string
  ) => {
    ctx.clearRect(0, 0, canvasSize, canvasSize)
    ctx.font = `${fontSize}px ${selectedFont}, sans-serif`
    ctx.textBaseline = 'middle'

    const lines = text.split('\n')
    const lineHeight = fontSize * 1.1
    const totalTextHeight = lineHeight * lines.length

    let startY = (canvasSize - totalTextHeight) / 2 + lineHeight / 2
    startY = Math.max(startY, lineHeight / 2) // startYが上すぎないようにする

    lines.forEach((line, index) => {
      const lineWidth = ctx.measureText(line).width
      const startX = canvasSize < lineWidth ? 0: (canvasSize - lineWidth) / 2
      if (outline) {
        ctx.setLineDash([])
        ctx.strokeStyle = outlineColor
        ctx.lineWidth = fontSize * 0.1 // フォントサイズの10%を輪郭線の太さとする
        ctx.lineJoin = 'round'
        ctx.miterLimit = 2
        ctx.strokeText(line, startX, startY + lineHeight * index, canvasSize)
      }
      ctx.fillStyle = color
      ctx.fillText(line, startX, startY + lineHeight * index, canvasSize)
    })

    // 点線の枠を描画
    ctx.strokeStyle = borderColor
    ctx.lineWidth = 1.0 // default
    ctx.setLineDash([5, 5])
    ctx.strokeRect(0, 0, canvasSize, canvasSize)
  }, [canvasSize, borderColor, selectedFont])

  useEffect(() => {
    const canvas = canvasRef.current
    if (canvas) {
      const ctx = canvas.getContext('2d')
      if (ctx) {
        if (text) {
          const fontSize = calculateOptimalFontSize(ctx, text, canvasSize - 10, canvasSize - 10)
          drawTextInCanvas(ctx, text, fontSize, textColor, showOutline, outlineColor)
        } else {
          // テキストがない場合は点線の枠だけを描画
          ctx.clearRect(0, 0, canvasSize, canvasSize)
          ctx.strokeStyle = borderColor
          ctx.setLineDash([5, 5])
          ctx.strokeRect(0, 0, canvasSize, canvasSize)
        }
      }
    }
  }, [text, textColor, showOutline, outlineColor, selectedFont, calculateOptimalFontSize, drawTextInCanvas, canvasSize, borderColor])

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value
    const lines = newText.split('\n')
    if (lines.length <= 3) {
      setText(newText)
    } else {
      setText(lines.slice(0, 3).join('\n'))
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && text.split('\n').length >= 3) {
      e.preventDefault()
    }
  }

  const handleDownload = () => {
    const canvas = canvasRef.current
    if (canvas) {
      const ctx = canvas.getContext('2d')
      if (ctx) {
        // 現在のキャンバスの内容を保存
        const imageData = ctx.getImageData(0, 0, canvasSize, canvasSize)
        
        // キャンバスをクリアして透明な背景にする
        ctx.clearRect(0, 0, canvasSize, canvasSize)
        
        // テキストを再描画（点線の枠なし）
        if (text) {
          const fontSize = calculateOptimalFontSize(ctx, text, canvasSize - 10, canvasSize - 10)
          ctx.font = `${fontSize}px ${selectedFont}, sans-serif`
          ctx.textBaseline = 'middle'
      
          const lines = text.split('\n')
          const lineHeight = fontSize * 1.1
          const totalTextHeight = lineHeight * lines.length
      
          let startY = (canvasSize - totalTextHeight) / 2 + lineHeight / 2
          startY = Math.max(startY, lineHeight / 2) // startYが上すぎないようにする
      
          lines.forEach((line, index) => {
            const lineWidth = ctx.measureText(line).width
            const startX = canvasSize < lineWidth ? 0: (canvasSize - lineWidth) / 2
            if (showOutline) {
              ctx.setLineDash([])
              ctx.strokeStyle = outlineColor
              ctx.lineWidth = fontSize * 0.1 // フォントサイズの10%を輪郭線の太さとする
              ctx.lineJoin = 'round'
              ctx.miterLimit = 2
              ctx.strokeText(line, startX, startY + lineHeight * index, canvasSize)
            }
            ctx.fillStyle = textColor
            ctx.fillText(line, startX, startY + lineHeight * index, canvasSize)
          })
        }

        // PNG形式でダウンロード
        const dataURL = canvas.toDataURL('image/png')
        const link = document.createElement('a')
        link.href = dataURL
        link.download = 'text-image.png'
        link.click()

        // キャンバスの内容を元に戻す
        ctx.putImageData(imageData, 0, 0)
      }
    }
  }

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTextColor(e.target.value)
  }

  const handleOutlineColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setOutlineColor(e.target.value)
  }

  return (
    <div className="flex flex-col items-center space-y-4 p-4 w-full">
      <div className="flex space-x-4 items-start max-w-xl w-full">
        <div className="flex flex-col space-y-2 grow">
          <Textarea
            value={text}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            placeholder="ここにテキストを入力してください（最大3行）"
            className="w-full h-24 resize-none"
            rows={3}
            maxLength={300}
            aria-label="テキスト入力（最大3行）"
          />
          <Popover open={isColorPickerOpen} onOpenChange={setIsColorPickerOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full flex items-center justify-center space-x-2"
                aria-label="文字色を選択"
              >
                <Palette className="w-4 h-4" />
                <span>文字色を選択</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64">
              <div className="flex flex-col space-y-2">
                <label htmlFor="color-picker" className="text-sm font-medium">
                  文字色
                </label>
                <input
                  id="color-picker"
                  type="color"
                  value={textColor}
                  onChange={handleColorChange}
                  className="w-full h-10 cursor-pointer"
                />
              </div>
            </PopoverContent>
          </Popover>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="show-outline"
              checked={showOutline}
              onCheckedChange={(checked) => setShowOutline(checked as boolean)}
            />
            <Label htmlFor="show-outline">文字に輪郭線を表示</Label>
          </div>
          <Popover open={isOutlineColorPickerOpen} onOpenChange={setIsOutlineColorPickerOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full flex items-center justify-center space-x-2"
                aria-label="輪郭線の色を選択"
                disabled={!showOutline}
              >
                <Palette className="w-4 h-4" />
                <span>輪郭線の色を選択</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64">
              <div className="flex flex-col space-y-2">
                <label htmlFor="outline-color-picker" className="text-sm font-medium">
                  輪郭線の色
                </label>
                <input
                  id="outline-color-picker"
                  type="color"
                  value={outlineColor}
                  onChange={handleOutlineColorChange}
                  className="w-full h-10 cursor-pointer"
                />
              </div>
            </PopoverContent>
          </Popover>
          <Select value={selectedFont} onValueChange={setSelectedFont}>
            <SelectTrigger className="w-full" aria-label="フォントを選択">
              <SelectValue placeholder="フォントを選択" />
            </SelectTrigger>
            <SelectContent>
              {fontOptions.map((font) => (
                <SelectItem key={font.value} value={font.value}>
                  {font.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <canvas
          ref={canvasRef}
          width={canvasSize}
          height={canvasSize}
          className="border border-dashed border-gray-300"
          aria-label="テキスト表示エリア"
        />
      </div>
      <Button onClick={handleDownload} className="flex items-center space-x-2">
        <Download className="w-4 h-4" />
        <span>画像をダウンロード</span>
      </Button>
    </div>
  )
}