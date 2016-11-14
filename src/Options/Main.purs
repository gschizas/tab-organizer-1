module Options.Main where

import Pauan.Prelude
import Pauan.Animation as Animation
import Pauan.Mutable as Mutable
import Pauan.HTML (render, widget, afterInsert, beforeRemove)


root :: HTML
root =
  widget \_ -> do
    a <- Mutable.make [1, 2, 3]

    dragging <- Mutable.make Nothing

    --setTimeout 1000 << runTransaction do
      --a >> Mutable.set [4, 5, 6]

    pure << html "div"
      [ style "width" "100%"
      , style "height" "100%"
      , style "cursor" (map (ifJust "grabbing" "") << view dragging) ]
      [ html "button"
          [ on "click" \_ -> runTransaction do
              a >> Mutable.set (1..200) ]
          [ text "Activate" ]
      , html "div"
          []
          (view a >> map \a ->
            a >> map \i ->
              widget \state -> do
                a <- Animation.make { duration: 5000.0 }
                --"Widget before" >> spy >> pure
                state >> afterInsert do
                  --"afterInsert" >> spy >> pure
                  a >> Animation.tweenTo 1.0
                --"Widget after" >> spy >> pure
                state >> beforeRemove do
                  --"beforeRemove" >> spy >> pure
                  a >> Animation.tweenTo 0.0
                --state >> keepUntil (a >> view >> is 0.0)
                isHovering <- Mutable.make false

                let
                  transform :: (Maybe DragEvent) -> String
                  transform x =
                    "translate3d(" ++
                      show (maybe 0 _.offsetX x) ++
                      "px, " ++
                      show (maybe 0 _.offsetY x) ++
                      "px, 0)"

                  width =
                    Animation.easeOut Animation.easeExponential >>> Animation.rangeSuffix 0.0 100.0 "px"

                  height =
                    Animation.easeInOut (Animation.easePow 4.0) >>> Animation.rangeSuffix 0.0 50.0 "px"

                  opacity hovering =
                    if hovering then "1" else "0.5"

                  backgroundColor t =
                    hsla
                      (t >> Animation.easePow 2.0 >> Animation.range 0.0 360.0)
                      100.0
                      50.0
                      0.5

                  zIndex = ifJust (show << (top :: Int)) ""

                pure << html "div"
                  [ onHoverSet isHovering
                  , onDragSet dragging
                  --, style "position" "fixed"
                  --, style "left" "50px"
                  --, style "top" "50px"
                  , style "transform" (map transform << view dragging)
                  , style "width" (map width << view a)
                  , style "height" (map height << view a)
                  , style "opacity" (map opacity << view isHovering)
                  , style "background-color" (map backgroundColor << view a)
                  , style "position" "relative"
                  , style "cursor" "grab"
                  , style "z-index" (map zIndex << view dragging)
                  ]
                  [ text (show i) ]) ]


main :: Eff () Unit
main = root >> render >> void

{-main :: Eff (err :: EXCEPTION) Unit
main = void << launchAff do
  liftEff do-}
    {-a <- Mutable.make 1
    b <- Mutable.make 2
    c <- Mutable.make 3
    observe
      (\a -> show a >> log)
      --(map (\a b c -> a + b + c) << view a |< view b |< view c)
      (view a >|
       view b >|
       view c >>
       map \a b c ->
         a + b + c)
      >> void
    runTransaction do
      a >> Mutable.set 20
    runTransaction do
      b >> Mutable.set 30
    runTransaction do
      c >> Mutable.set 40
    runTransaction do
      a >> Mutable.set 1
      b >> Mutable.set 2
      c >> Mutable.set 3-}
