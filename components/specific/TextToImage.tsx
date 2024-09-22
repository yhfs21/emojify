'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Download, Palette } from "lucide-react"

export default function TextToImage() {
  const [text, setText] = useState('')
  const [textColor, setTextColor] = useState('#000000')
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const canvasSize = 128 // キャンバスのサイズを固定

  const calculateOptimalFontSize = useCallback((ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxHeight: number) => {
    let fontSize = 100 // 大きな値から開始
    const lines = text.split('\n')
    const lineCount = lines.length
    const minLineHeight = 1.2 // 日本語テキストの行間を少し広げる

    while (fontSize > 1) {
      ctx.font = `${fontSize}px 'Hiragino Sans', 'Meiryo', sans-serif`
      let totalHeight = 0
      let maxLineWidth = 0

      for (let i = 0; i < lineCount; i++) {
        const lineWidth = ctx.measureText(lines[i]).width
        maxLineWidth = Math.max(maxLineWidth, lineWidth)
        totalHeight += fontSize * minLineHeight
      }

      if (maxLineWidth <= maxWidth && totalHeight <= maxHeight) {
        return fontSize
      }

      fontSize--
    }

    return fontSize
  }, [])

  const drawTextInCanvas = useCallback((ctx: CanvasRenderingContext2D, text: string, fontSize: number, color: string) => {
    ctx.clearRect(0, 0, canvasSize, canvasSize)
    ctx.font = `${fontSize}px 'Hiragino Sans', 'Meiryo', sans-serif`
    ctx.fillStyle = color
    ctx.textBaseline = 'middle'

    const lines = text.split('\n')
    const lineHeight = fontSize * 1.2
    const totalTextHeight = lineHeight * lines.length

    let startY = (canvasSize - totalTextHeight) / 2 + lineHeight / 2
    startY = Math.max(startY, lineHeight / 2) // startYが上すぎないようにする

    lines.forEach((line, index) => {
      const lineWidth = ctx.measureText(line).width
      const startX = (canvasSize - lineWidth) / 2
      ctx.fillText(line, startX, startY + lineHeight * index)
    })

    // 点線の枠を描画
    ctx.strokeStyle = color
    ctx.setLineDash([5, 5])
    ctx.strokeRect(0, 0, canvasSize, canvasSize)
  }, [canvasSize])

  useEffect(() => {
    const canvas = canvasRef.current
    if (canvas) {
      const ctx = canvas.getContext('2d')
      if (ctx) {
        if (text) {
          const fontSize = calculateOptimalFontSize(ctx, text, canvasSize - 10, canvasSize - 10)
          drawTextInCanvas(ctx, text, fontSize, textColor)
        } else {
          // テキストがない場合は点線の枠だけを描画
          ctx.clearRect(0, 0, canvasSize, canvasSize)
          ctx.strokeStyle = textColor
          ctx.setLineDash([5, 5])
          ctx.strokeRect(0, 0, canvasSize, canvasSize)
        }
      }
    }
  }, [text, textColor, calculateOptimalFontSize, drawTextInCanvas, canvasSize])

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
          ctx.font = `${fontSize}px 'Hiragino Sans', 'Meiryo', sans-serif`
          ctx.fillStyle = textColor
          ctx.textBaseline = 'middle'

          const lines = text.split('\n')
          const lineHeight = fontSize * 1.2
          const totalTextHeight = lineHeight * lines.length

          let startY = (canvasSize - totalTextHeight) / 2 + lineHeight / 2
          startY = Math.max(startY, lineHeight / 2)

          lines.forEach((line, index) => {
            const lineWidth = ctx.measureText(line).width
            const startX = (canvasSize - lineWidth) / 2
            ctx.fillText(line, startX, startY + lineHeight * index)
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

  return (
    <div className="flex flex-col items-center space-y-4 p-4">
      <div className="flex space-x-4 items-start">
        <div className="flex flex-col space-y-2">
          <Textarea
            value={text}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            placeholder="ここにテキストを入力してください（最大3行）"
            className="w-64 h-24 resize-none"
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