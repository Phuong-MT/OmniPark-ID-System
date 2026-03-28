#!/bin/bash

# 📁 Thư mục chứa skills
SKILL_DIR=".agent/skills/skills"

# ✅ Danh sách skill cần giữ lại (EDIT ở đây)
KEEP_SKILLS=(
  # ===== FRONTEND =====
  "nextjs-best-practices"
  "react-best-practices"
  "react-state-management"
  "tailwind-patterns"

  # ===== BACKEND =====
  "nestjs-expert"
  "backend-architect"
  "api-design-principles"
  "nodejs-backend-patterns"
  "database-design"

  # ===== IOT / C++ =====
  "cpp-pro"
  "firmware-analyst"
  "network-101"
  "systematic-debugging"
)

echo "🧹 Cleaning unused skills..."

cd "$SKILL_DIR" || {
  echo "❌ Skill directory not found!"
  exit 1
}

for skill in *; do
  # Bỏ qua file README
  if [[ "$skill" == "README.md" ]]; then
    continue
  fi

  keep=false

  for k in "${KEEP_SKILLS[@]}"; do
    if [[ "$skill" == "$k" ]]; then
      keep=true
      break
    fi
  done

  if [ "$keep" = false ]; then
    echo "❌ Removing: $skill"
    rm -rf "$skill"
  else
    echo "✅ Keeping: $skill"
  fi
done

echo "🎉 Done cleaning skills!"