"""Ad description groups; trim the seeded description lines

Two client requests, 29 Sep 2026, on the Platform Admin's Ad Descriptions
screen:

1. "make these tabs also dynamic, user can add more variety" — a new
   `ad_description_groups` table (named groups inside each ad type, e.g.
   "Teaching" under Hiring) and a nullable `group_id` on each line. Lines with
   no group are "General". Deleting a group moves its lines back to General.

2. "don't add so many seed data, keep max 1-2 items seeded" — 0009 seeded 18
   lines per ad type. This keeps the first two per ad type (by current order)
   and deletes the rest, but ONLY lines still exactly as seeded: text
   unchanged and not created by an admin (`created_by` is NULL only for seeded
   rows). Anything an admin wrote or edited survives. The seed text is copied
   here rather than imported so this migration keeps meaning the same thing.

Downgrade drops the groups; it does not restore deleted seed lines.

Revision ID: 0012
Revises: 0011
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "0012"
down_revision: Union[str, None] = "0011"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

KEEP_PER_SECTION = 2

# Every line 0009 inserted, as seeded.
SEEDED = {
    "Admissions for the upcoming session are now open at {name}.",
    "Experienced faculty, proven results and a structured learning plan.",
    "Submit an enquiry to check eligibility and reserve your seat.",
    "Seats are filling fast for the current admission cycle.",
    "Choose from our full range of courses with flexible batch timings.",
    "Enquire today and our admission team will guide you through the process.",
    "Begin your preparation with a team that has delivered consistent results.",
    "Small batches, regular assessments and one-to-one doubt clearing.",
    "Apply now — admission closes once the batch is full.",
    "Merit-based scholarships are available for eligible students this session.",
    "Fee concessions are decided on past academic performance.",
    "Send an enquiry to know the scholarship criteria and last date.",
    "A new batch is starting shortly at {name}.",
    "Complete syllabus coverage, study material and test series included.",
    "Register now to confirm your place in this batch.",
    "Admission is open across all streams and class levels.",
    "Qualified faculty, modern infrastructure and a safe campus.",
    "Contact us for the prospectus, fee structure and admission form.",
    "{name} is hiring qualified and motivated teaching professionals.",
    "Competitive salary, a supportive team and long-term growth.",
    "Apply directly through this post — no separate form needed.",
    "We are looking for experienced faculty to join our academic team.",
    "The role involves classroom teaching, assessment and student mentoring.",
    "Apply now with your qualification and teaching experience.",
    "Applications are invited for teaching and academic staff positions.",
    "Candidates with relevant subject expertise are preferred.",
    "Apply here — shortlisted candidates will be contacted for an interview.",
    "Join an institution that invests in its teachers.",
    "Structured induction, teaching resources and professional development.",
    "Submit your application through this post to be considered.",
    "Multiple vacancies are open across subjects and departments.",
    "Both full-time and visiting faculty positions are available.",
    "Apply now and mention your subject and availability.",
    "A rewarding opportunity for educators who want to make an impact.",
    "Work with a committed academic team and motivated students.",
    "Apply directly — we review every application we receive.",
    "Download this study material free of cost — no enquiry form required.",
    "Prepared by the faculty at {name} from the latest syllabus.",
    "Use it for revision, practice and self-assessment.",
    "This paper covers the important questions for the current exam pattern.",
    "Questions are arranged chapter-wise for systematic revision.",
    "Download the PDF and start practising today.",
    "Free and complete — solutions are included with every question.",
    "Based on previous years and the most recent examination trend.",
    "Download now and check your preparation level.",
    "A quick-revision resource compiled by experienced subject teachers.",
    "Covers every key concept you need before the exam.",
    "Download the PDF — no sign-up or payment needed.",
    "Practise with a paper that follows the real exam format and marking.",
    "Attempt it in exam conditions to judge your speed and accuracy.",
    "Download it free and review the answer key afterwards.",
    "Complete notes for the full syllabus, in one downloadable file.",
    "Written in simple language with diagrams and worked examples.",
    "Download now and keep it handy through the session.",
}


def upgrade() -> None:
    op.create_table(
        "ad_description_groups",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("section", sa.String(), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("sort_order", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_by", sa.String(), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.UniqueConstraint("section", "name", name="uq_ad_description_group_name"),
    )
    op.add_column(
        "ad_description_templates",
        sa.Column(
            "group_id",
            sa.String(),
            sa.ForeignKey("ad_description_groups.id", ondelete="SET NULL", name="fk_ad_description_templates_group"),
            nullable=True,
        ),
    )

    # --- Trim the seed ---
    conn = op.get_bind()
    rows = conn.execute(sa.text(
        "SELECT id, section, text, created_by FROM ad_description_templates "
        "ORDER BY section, sort_order, created_at"
    )).fetchall()
    kept = {}
    doomed = []
    for row in rows:
        n = kept.get(row.section, 0)
        if n < KEEP_PER_SECTION:
            kept[row.section] = n + 1
            continue
        if row.created_by is None and row.text in SEEDED:
            doomed.append(row.id)
    for row_id in doomed:
        conn.execute(sa.text("DELETE FROM ad_description_templates WHERE id = :id"), {"id": row_id})


def downgrade() -> None:
    op.drop_constraint("fk_ad_description_templates_group", "ad_description_templates", type_="foreignkey")
    op.drop_column("ad_description_templates", "group_id")
    op.drop_table("ad_description_groups")
