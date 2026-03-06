"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useState } from "react"

export function LoginForm() {
  const [email, setEmail] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle login logic here
    console.log("[v0] Login attempt with email:", email)
  }

  return (
    <div className="w-full space-y-8">
      {/* Logo */}
      <div className="flex justify-center items-center gap-3 mb-8">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-[#4F46E5] to-[#7C3AED]">
          <span className="text-2xl font-bold text-white">HX</span>
        </div>
        <span className="text-3xl font-bold bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] bg-clip-text text-transparent">
          Hyrix
        </span>
      </div>
      {/* Login Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium text-foreground">
            Enter Email Address...
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="Enter Email Address..."
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="h-12 rounded-full border-muted-foreground/20 focus:border-primary px-6"
          />
        </div>

        <Button
          type="submit"
          className="w-full h-12 text-base font-semibold bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] text-white hover:opacity-90 transition-opacity rounded-full shadow-md"
        >
          Next
        </Button>
      </form>

      {/* Forgot Password Link */}
      <div className="text-center">
        <Link href="/forgot-password" className="text-sm font-medium text-primary hover:underline transition-colors">
          Forgot password?
        </Link>
      </div>

      {/* Divider */}
      <div className="relative my-8">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-muted" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">Or</span>
        </div>
      </div>

      {/* Sign Up Link */}
      <div className="text-center space-y-4">
        <p className="text-sm text-muted-foreground">
          Don't have an account?{" "}
          <Link href="/register" className="font-semibold text-primary hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}
