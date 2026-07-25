import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { TUTORIAL_STEPS } from '../lib/tutorialSteps'

const TutorialContext = createContext(null)

export function TutorialProvider({ children }) {
  const [running, setRunning] = useState(false)
  const [stepIndex, setStepIndex] = useState(0)
  const navigate = useNavigate()
  const location = useLocation()
  const timerRef = useRef(null)

  const clearTimer = () => { if (timerRef.current) clearTimeout(timerRef.current) }

  const goToStep = useCallback((index) => {
    if (index < 0) index = 0
    if (index >= TUTORIAL_STEPS.length) { setRunning(false); return }
    setStepIndex(index)
    const step = TUTORIAL_STEPS[index]
    if (step.page && step.page !== location.pathname) navigate(step.page)
  }, [navigate, location.pathname])

  const start = useCallback(() => {
    setRunning(true)
    setStepIndex(0)
    navigate(TUTORIAL_STEPS[0].page)
  }, [navigate])

  const stop = useCallback(() => {
    clearTimer()
    setRunning(false)
  }, [])

  const next = useCallback(() => {
    clearTimer()
    goToStep(stepIndex + 1)
  }, [stepIndex, goToStep])

  const back = useCallback(() => {
    clearTimer()
    goToStep(stepIndex - 1)
  }, [stepIndex, goToStep])

  // Auto-advance timer for the current step
  useEffect(() => {
    if (!running) return
    clearTimer()
    const step = TUTORIAL_STEPS[stepIndex]
    if (!step) return
    timerRef.current = setTimeout(() => goToStep(stepIndex + 1), step.autoMs || 5000)
    return clearTimer
  }, [running, stepIndex]) // eslint-disable-line

  const currentStep = running ? TUTORIAL_STEPS[stepIndex] : null

  return (
    <TutorialContext.Provider value={{
      running, stepIndex, totalSteps: TUTORIAL_STEPS.length, currentStep,
      start, stop, next, back,
    }}>
      {children}
    </TutorialContext.Provider>
  )
}

export const useTutorial = () => useContext(TutorialContext)
