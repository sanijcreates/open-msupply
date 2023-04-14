use crate::NameTagRow;

pub fn mock_name_tag_1() -> NameTagRow {
    NameTagRow {
        id: "name_tag_1".to_string(),
        name: "NewProgramTag1".to_string(),
    }
}

pub fn mock_name_tags() -> Vec<NameTagRow> {
    vec![mock_name_tag_1()]
}
