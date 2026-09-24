"""Ad description templates, editable by the Main Admin

The predecided ad descriptions (client feedback 22 Sep 2026, row 5) were a
constant in frontend/src/constants/adTemplates.js. The client then asked for
them to be "customizable as per requirement", so they move into a table the
Platform Admin edits.

Each template is ONE line. The client's "3 Line" requirement means an ad's
description is built by ticking up to three single-line options — not by
picking one three-line block (clarified 24 Sep 2026: "each option item for
desc should be single line"). Seeded with the lines of the three-line blocks
the frontend constant held, split apart. The seed is written out
here rather than imported: a migration must keep producing the same rows even
after the application's defaults change.

Purely additive — no existing row changes. Ads store the filled-in text, not a
reference to a template, so nothing needs backfilling.

Revision ID: 0009
Revises: 0008
"""
from typing import Sequence, Union
import uuid

from alembic import op
import sqlalchemy as sa

revision: str = "0009"
down_revision: Union[str, None] = "0008"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


SEED = {
    "admission": [
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
    ],
    "job": [
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
    ],
    "paper": [
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
    ],
}


def upgrade() -> None:
    table = op.create_table(
        "ad_description_templates",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("section", sa.String(), nullable=False),
        sa.Column("text", sa.String(), nullable=False),
        sa.Column("sort_order", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_by", sa.String(), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index(
        "ix_ad_description_templates_section_order",
        "ad_description_templates",
        ["section", "sort_order"],
    )

    op.bulk_insert(
        table,
        [
            {"id": str(uuid.uuid4()), "section": section, "text": text, "sort_order": i + 1}
            for section, texts in SEED.items()
            for i, text in enumerate(texts)
        ],
    )


def downgrade() -> None:
    op.drop_index("ix_ad_description_templates_section_order", table_name="ad_description_templates")
    op.drop_table("ad_description_templates")
