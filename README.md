# Storix - File Storage and Sharing Platform

A secure file storage and sharing platform built with Ruby on Rails 8.0 and React 19, featuring OAuth authentication and S3-compatible storage.

## ⚠️ Security Warning
**Never commit your real `.env` file or any secrets to version control.**
Always use placeholder values in documentation and keep your secrets safe.

## Features

- 🔐 **OAuth Authentication** - Login with Google or GitHub
- 📁 **File Management** - Upload, download, organize files
- 🔗 **Share Links** - Generate secure sharing links
- ☁️ **Multi-Provider Storage** - Support for AWS S3, DigitalOcean Spaces, and custom S3-compatible storage
- 🎨 **Modern UI** - Built with React, Tailwind CSS, and shadcn/ui

## Tech Stack

- **Backend:** Ruby on Rails 8.0, PostgreSQL, JWT Authentication
- **Frontend:** React 19, Vite, Tailwind CSS, shadcn/ui
- **Storage:** AWS SDK for S3, support for S3-compatible services
- **Authentication:** OmniAuth with Google and GitHub OAuth
