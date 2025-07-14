terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 4.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

variable "aws_region" {
  type    = string
  default = "us-east-1"
}

variable "environment" {
  type    = string
  default = "dev"
}

variable "project" {
  type    = string
  default = "saas-linkedin"
}

variable "ai_files_bucket" {
  type        = string
  description = "Name of the S3 bucket to store AI files"
}

variable "ai_files" {
  type        = list(string)
  description = "List of AI file paths (relative to this module) to upload"
}

variable "content_types" {
  type = map(string)
  default = {
    json = "application/json"
    yaml = "application/x-yaml"
    yml  = "application/x-yaml"
    txt  = "text/plain"
    md   = "text/markdown"
    js   = "application/javascript"
    ts   = "application/typescript"
    html = "text/html"
  }
}

resource "aws_s3_bucket" "ai_files" {
  bucket = var.ai_files_bucket
  acl    = "private"

  force_destroy = var.environment == "dev" ? true : false

  server_side_encryption_configuration {
    rule {
      apply_server_side_encryption_by_default {
        sse_algorithm = "AES256"
      }
    }
  }

  tags = {
    Name        = var.ai_files_bucket
    Environment = var.environment
    Project     = var.project
  }
}

resource "aws_s3_bucket_public_access_block" "ai_files_block" {
  bucket                  = aws_s3_bucket.ai_files.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_versioning" "ai_files_versioning" {
  bucket = aws_s3_bucket.ai_files.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_object" "ai_files_upload" {
  for_each = toset(var.ai_files)

  bucket       = aws_s3_bucket.ai_files.id
  key          = each.value
  source       = "${path.module}/${each.value}"
  etag         = filemd5("${path.module}/${each.value}")
  acl          = "private"
  content_type = lookup(
    var.content_types,
    lower(regex_replace(each.value, ".*\\.([^.]*)$", "$1")),
    "application/octet-stream"
  )
}